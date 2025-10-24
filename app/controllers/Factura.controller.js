// controllers/factura.controller.js
const db = require("../models");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const Factura = db.facturaEncabezados;
const FacturaDetalle = db.facturaDetalles;
const Envio = db.envios;
const Inventario = db.inventarios;
const Producto = db.productos;

exports.create = async (req, res) => {
  const { usuarioId, direccionEnvio, paymentMethodId, detalles } = req.body;

  if (!usuarioId) return res.status(400).json({ message: "Falta usuarioId" });
  if (!paymentMethodId) return res.status(400).json({ message: "Falta paymentMethodId" });
  if (!detalles || detalles.length === 0)
    return res.status(400).json({ message: "Falta la lista de detalles del carrito" });

  const t = await db.sequelize.transaction();

  try {
    let subtotal = 0;

    // Validar stock y calcular subtotal
    for (const item of detalles) {
      const inventario = await Inventario.findByPk(item.inventarioId, { include: [{ model: Producto }] });
      if (!inventario) throw new Error(`Inventario ${item.inventarioId} no encontrado`);
      if (inventario.cantidad < item.cantidad)
        throw new Error(`Inventario insuficiente para ${inventario.producto.nombre}`);

      item.precioUnitario = inventario.producto.precio;
      item.subtotal = inventario.producto.precio * item.cantidad;
      subtotal += item.subtotal;
    }

    const iva = subtotal * 0.12;
    const total = subtotal + iva;

    // Crear PaymentIntent con Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: "gtq",
      payment_method: paymentMethodId,
      confirm: true,
    });

    if (paymentIntent.status !== "succeeded")
      throw new Error("El pago no se completó correctamente");

    // Crear Factura
    const factura = await Factura.create(
      { usuarioId, fecha: new Date(), subtotal, iva, total },
      { transaction: t }
    );

    // Crear detalles y actualizar inventario
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

    // Crear envío si hay dirección
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
          include: [
            { model: Inventario, include: [{ model: Producto, attributes: ["nombre", "precio"] }] },
          ],
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
