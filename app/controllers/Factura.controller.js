// controllers/factura.controller.js
const db = require("../models");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const Factura = db.facturaEncabezados;
const FacturaDetalle = db.facturaDetalles;
const Usuario = db.usuarios;
const Envio = db.envios;
const EstadoEnvio = db.estadoEnvios;
const Promocion = db.promociones;
const Inventario = db.inventarios;
const Producto = db.productos;

exports.create = async (req, res) => {
  const {
    usuarioId,
    direccionEnvio,
    detalles, // [{ inventarioId, cantidad }]
    promocionId,
    paymentMethodId // <-- viene del frontend
  } = req.body;

  if (!Array.isArray(detalles) || detalles.length === 0) {
    return res.status(400).json({ message: "Detalles inválidos" });
  }

  if (!paymentMethodId) {
    return res.status(400).json({ message: "Falta paymentMethodId" });
  }

  const t = await db.sequelize.transaction();

  try {
    // -----------------------
    // Calcular subtotal
    // -----------------------
    let subtotal = 0;
    for (const item of detalles) {
      const invId = parseInt(item.inventarioId, 10);
      const qty = parseInt(item.cantidad, 10);

      if (Number.isNaN(invId) || Number.isNaN(qty)) {
        throw new Error("InventarioId o cantidad inválidos");
      }

      const inventario = await Inventario.findByPk(invId, {
        include: [{ model: Producto }],
      });
      if (!inventario) throw new Error("Inventario no encontrado");

      subtotal += inventario.producto.precio * qty;
    }

    // -----------------------
    // Aplicar promoción
    // -----------------------
    let descuento = 0;
    if (promocionId) {
      const promo = await Promocion.findByPk(promocionId);
      if (promo && promo.activo) {
        descuento = (subtotal * promo.descuento) / 100;
      }
    }

    const subtotalConDescuento = subtotal - descuento;
    const iva = subtotalConDescuento * 0.12;
    const total = subtotalConDescuento;

// -----------------------
// Crear y confirmar PaymentIntent
// -----------------------
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(total * 100), // en centavos
  currency: "gtq", // o "usd" si usas dólares
  description: "Pago de factura Tienda Online",
  payment_method: paymentMethodId,
  confirm: true,
  automatic_payment_methods: {
    enabled: true,
    allow_redirects: "never", // 🔥 evita redirecciones y el error del return_url
  },
});


    // ----------------------------
    // Crear factura (pendiente)
    // -----------------------------
    const factura = await Factura.create(
      {
        usuarioId,
        fecha: new Date(),
        subtotal,
        iva,
        total,
        promocionId,
      },
      { transaction: t }
    );

    // -----------------------
    // Crear detalles
    // -----------------------
    for (const item of detalles) {
      const invId = parseInt(item.inventarioId, 10);
      const qty = parseInt(item.cantidad, 10);

      const inventario = await Inventario.findByPk(invId, {
        include: [{ model: Producto }],
      });

      if (!inventario) throw new Error("Inventario no encontrado");
      if (inventario.cantidad < qty) {
        throw new Error('Inventario insuficiente para ${inventario.producto.nombre');
      }

      await FacturaDetalle.create(
        {
          facturaId: factura.id,
          inventarioId: invId,
          cantidad: qty,
          precioUnitario: inventario.producto.precio,
          subtotal: inventario.producto.precio * qty,
        },
        { transaction: t }
      );
    }

    // -----------------------
    // Crear Envío (pendiente)
    // -----------------------
    const envio = await Envio.create(
      {
        facturaId: factura.id,
        direccionEnvio,
        estadoId: 1, // Pendiente
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
      },
      { transaction: t }
    );

    await t.commit();

    // ✅ Responder con client_secret para confirmar el pago en el frontend
    res.status(201).json({
      message: "Factura creada. Confirmar pago en cliente.",
      factura,
      envio,
      clientSecret: paymentIntent.client_secret,
      stripePaymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    await t.rollback();
    console.error("ERROR /api/facturas ->", error);
    res.status(500).json({ message: error.message || "Error al crear la factura" });
  }
};

// Obtener todas las facturas (incluye total)
exports.findAll = async (req, res) => {
  try {
    const facturas = await Factura.findAll({
      include: [
        {
          model: FacturaDetalle,
          include: [{ model: Inventario, include: [Producto] }],
        },
        { model: Envio },
      ],
      order: [["fecha", "DESC"]],
    });

    if (!facturas || facturas.length === 0) {
      return res.status(404).json({ message: "No hay facturas registradas" });
    }

    res.status(200).json(facturas);
  } catch (error) {
    console.error("ERROR /api/facturas ->", error);
    res.status(500).json({ message: "Error al obtener las facturas" });
  }
};

// Obtener todas las facturas por usuario (incluye total)
exports.findAllByUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const facturas = await Factura.findAll({
      where: { usuarioId },
      include: [
        {
          model: FacturaDetalle,
          include: [{ model: Inventario, include: [Producto] }],
        },
        { model: Envio },
      ],
      order: [["fecha", "DESC"]],
    });

    if (!facturas || facturas.length === 0) {
      return res
        .status(404)
        .json({ message: "El usuario no tiene facturas registradas" });
    }

    res.status(200).json(facturas);
  } catch (error) {
    console.error("ERROR /api/facturas/usuario/:usuarioId ->", error);
    res
      .status(500)
      .json({ message: "Error al obtener las facturas del usuario" });
  }
};
