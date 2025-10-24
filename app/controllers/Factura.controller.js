// controllers/factura.controller.js
const db = require("../models");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const Factura = db.facturaEncabezados;
const FacturaDetalle = db.facturaDetalles;
const Envio = db.envios;
const Carrito = db.carritos;
const CarritoDetalle = db.carritoDetalles;
const Inventario = db.inventarios;
const Producto = db.productos;

exports.create = async (req, res) => {
  const { usuarioId, carritoId, direccionEnvio, paymentMethodId } = req.body;

  if (!usuarioId) return res.status(400).json({ message: "Falta usuarioId" });
  if (!carritoId) return res.status(400).json({ message: "Falta carritoId" });
  if (!paymentMethodId) return res.status(400).json({ message: "Falta paymentMethodId" });

  const t = await db.sequelize.transaction();

  try {
    // 🔹 Obtener detalles del carrito
    const carrito = await Carrito.findByPk(carritoId, {
      include: [
        {
          model: CarritoDetalle,
          include: [{ model: Inventario, include: [Producto] }],
        },
      ],
    });

    if (!carrito) {
      await t.rollback();
      return res.status(400).json({ message: "⚠ No se encontró el carrito para procesar el pago." });
    }

    if (!carrito.carritoDetalles || carrito.carritoDetalles.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: "⚠ El carrito está vacío." });
    }

    let subtotal = 0;
    const detalles = [];

    // 🔹 Validar stock y preparar detalles
    for (const item of carrito.carritoDetalles) {
      const inventario = item.inventario;
      if (!inventario) throw new Error(`Inventario ${item.inventarioId} no encontrado`);
      if (inventario.cantidad < item.cantidad)
        throw new Error(`Inventario insuficiente para ${inventario.producto.nombre}`);

      const itemSubtotal = inventario.producto.precio * item.cantidad;
      subtotal += itemSubtotal;

      detalles.push({
        inventarioId: inventario.id,
        cantidad: item.cantidad,
        precioUnitario: inventario.producto.precio,
        subtotal: itemSubtotal,
      });
    }

    const iva = subtotal * 0.12;
    const total = subtotal + iva;

    // 🔹 Crear PaymentIntent con Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: "gtq",
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    });

    if (paymentIntent.status !== "succeeded")
      throw new Error("El pago no se completó correctamente");

    // 🔹 Crear Factura
    const factura = await Factura.create(
      { usuarioId, fecha: new Date(), subtotal, iva, total },
      { transaction: t }
    );

    // 🔹 Crear detalles y actualizar inventario
    for (const item of detalles) {
      await FacturaDetalle.create(
        {
          facturaId: factura.id,
          inventarioId: item.inventarioId,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          subtotal: item.subtotal,
        },
        { transaction: t }
      );

      const inventario = await Inventario.findByPk(item.inventarioId);
      inventario.cantidad -= item.cantidad;
      await inventario.save({ transaction: t });
    }

    // 🔹 Crear envío si hay dirección
    let envio = null;
    if (direccionEnvio) {
      envio = await Envio.create(
        {
          facturaId: factura.id,
          direccionEnvio,
          estadoId: 1, // Pendiente
          fechaCreacion: new Date(),
          fechaActualizacion: new Date(),
        },
        { transaction: t }
      );
    }

    // 🔹 Vaciar carrito
    await CarritoDetalle.destroy({ where: { carritoId }, transaction: t });

    await t.commit();

    res.status(201).json({
      message: "Factura creada y pagada con éxito",
      factura,
      envio,
      stripeStatus: paymentIntent.status,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    await t.rollback();
    console.error("ERROR /api/facturas ->", error);
    res.status(500).json({ message: error.message || "Error al crear la factura" });
  }
};

// Obtener todas las facturas
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
    });

    res.status(200).json(facturas);
  } catch (error) {
    console.error("ERROR /api/facturas ->", error);
    res.status(500).json({ message: "Error al obtener las facturas" });
  }
};
