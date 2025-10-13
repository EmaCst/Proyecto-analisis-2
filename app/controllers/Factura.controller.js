// controllers/factura.controller.js
const db = require("../models");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Modelos (ajusta si difieren)
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
    // Ahora esperamos un objeto `card` con los datos crudos:
    // card: { number, exp_month, exp_year, cvc }
    card
  } = req.body;

  // Validaciones básicas
  if (!Array.isArray(detalles) || detalles.length === 0) {
    return res.status(400).json({ message: "Detalles inválidos" });
  }
  if (!card || !card.number || !card.exp_month || !card.exp_year || !card.cvc) {
    return res.status(400).json({ message: "Faltan datos de la tarjeta (card)" });
  }

  const t = await db.sequelize.transaction();

  try {
    // Calcular subtotal (asegurando parseInt para evitar NaN)
    let subtotal = 0;
    for (const item of detalles) {
      const invId = parseInt(item.inventarioId, 10);
      const qty = parseInt(item.cantidad, 10);
      if (Number.isNaN(invId) || Number.isNaN(qty)) throw new Error("InventarioId o cantidad inválidos");

      const inventario = await Inventario.findByPk(invId, {
        include: [{ model: Producto }],
      });
      if (!inventario) throw new Error("Inventario no encontrado");

      subtotal += inventario.producto.precio * qty;
    }

    // Aplicar promoción (si hay)
    let descuento = 0;
    if (promocionId) {
      const promo = await Promocion.findByPk(promocionId);
      if (promo && promo.activo) {
        descuento = (subtotal * promo.descuento) / 100;
      }
    }

    const subtotalConDescuento = subtotal - descuento;
    const iva = subtotalConDescuento * 0.12;
    const total = subtotalConDescuento + iva;

    // -----------------------
    // Crear PaymentIntent usando los datos crudos de la tarjeta (raw card)
    // -----------------------
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // en centavos
      currency: "usd",
      description: "Pago de factura Tienda Online",
      payment_method_data: {
        type: "card",
        card: {
          number: String(card.number).replace(/\s+/g, ""), // limpiar espacios
          exp_month: parseInt(card.exp_month, 10),
          exp_year: parseInt(card.exp_year, 10),
          cvc: String(card.cvc)
        }
      },
      confirm: true, // confirmar inmediatamente
      // automatic_payment_methods: { enabled: true } // opcional
    });

    // Si Stripe devolviera un status distinto a succeeded, podrías manejarlo
    if (!paymentIntent || (paymentIntent.status !== 'succeeded' && paymentIntent.status !== 'requires_capture')) {
      // permitimos 'requires_capture' si capturas más tarde; ajusta según flujo
      throw new Error(`Pago no completado. Estado Stripe: ${paymentIntent.status}`);
    }

    // -----------------------
    // Crear factura encabezado
    // -----------------------
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
    // Crear detalles y actualizar inventario
    // -----------------------
    for (const item of detalles) {
      const invId = parseInt(item.inventarioId, 10);
      const qty = parseInt(item.cantidad, 10);

      const inventario = await Inventario.findByPk(invId, {
        include: [{ model: Producto }],
      });

      if (!inventario) throw new Error("Inventario no encontrado");
      if (inventario.cantidad < qty)
        throw new Error(`Inventario insuficiente para ${inventario.producto.nombre}`);

      // Crear detalle
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

      // Disminuir inventario
      inventario.cantidad -= qty;
      await inventario.save({ transaction: t });
    }

    // -----------------------
    // Crear Envío
    // -----------------------
    const envio = await Envio.create(
      {
        facturaId: factura.id,
        direccionEnvio,
        estadoId: 1, // "Pendiente"
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
      },
      { transaction: t }
    );

    await t.commit();

    res.status(201).json({
      message: "Factura creada y pagada con éxito",
      factura,
      envio,
      stripeStatus: paymentIntent.status,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    await t.rollback();
    console.error("ERROR /api/facturas ->", error);
    // Devuelve mensaje claro al cliente (en test está bien mostrar error.message)
    res.status(500).json({ message: error.message || "Error al crear la factura" });
  }
};

// Obtener todas las facturas
exports.findAll = async (req, res) => {
  try {
    const facturas = await Factura.findAll({
      include: [
        {
          model: Usuario,
          attributes: ["nombre", "email"],
        },
        {
          model: Promocion,
          attributes: ["nombre", "descuento"],
        },
        {
          model: Envio,
          include: [
            {
              model: EstadoEnvio,
              attributes: ["nombre"],
            },
          ],
        },
        {
          model: FacturaDetalle,
          include: [
            {
              model: Inventario,
              include: [{ model: Producto, attributes: ["nombre", "precio"] }],
            },
          ],
        },
      ],
    });

    res.status(200).json(facturas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener las facturas" });
  }
};
