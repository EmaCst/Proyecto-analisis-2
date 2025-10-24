// controllers/factura.controller.js
const db = require("../models");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const Factura = db.facturaEncabezados;
const FacturaDetalle = db.facturaDetalles;
const Envio = db.envios;
const Inventario = db.inventarios;
const Producto = db.productos;
const Carrito = db.carritos;
const DetalleCarrito = db.detalleCarritos;

exports.create = async (req, res) => {
  const { usuarioId, carritoId, direccionEnvio, paymentMethodId } = req.body;

  if (!usuarioId) return res.status(400).json({ message: "Falta usuarioId" });
  if (!carritoId) return res.status(400).json({ message: "Falta carritoId" });
  if (!paymentMethodId)
    return res.status(400).json({ message: "Falta paymentMethodId" });

  const t = await db.sequelize.transaction();

  try {
    // Buscar el carrito por su ID
    const carrito = await Carrito.findByPk(carritoId, {
      include: [
        {
          model: DetalleCarrito,
          include: [{ model: Inventario, include: [{ model: Producto }] }],
        },
      ],
    });

    if (!carrito || carrito.detalleCarritos.length === 0) {
      throw new Error("El carrito está vacío o no existe.");
    }

    let subtotal = 0;
    const detallesFactura = [];

    // Validar stock y calcular subtotal
    for (const detalle of carrito.detalleCarritos) {
      const inventario = detalle.inventario;
      if (!inventario)
        throw new Error(
          `Inventario no encontrado para un producto del carrito.`
        );
      if (inventario.cantidad < detalle.cantidad)
        throw new Error(
          `Inventario insuficiente para ${inventario.producto.nombre}`
        );

      const precioUnitario = inventario.producto.precio;
      const subtotalItem = precioUnitario * detalle.cantidad;
      subtotal += subtotalItem;

      detallesFactura.push({
        inventarioId: inventario.id,
        cantidad: detalle.cantidad,
        precioUnitario,
        subtotal: subtotalItem,
      });
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

    // Crear detalles de factura y actualizar inventario
    for (const item of detallesFactura) {
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
          estadoId: 1,
          fechaCreacion: new Date(),
          fechaActualizacion: new Date(),
        },
        { transaction: t }
      );
    }

    // Vaciar carrito tras pagar
    await DetalleCarrito.destroy({
      where: { carritoId: carrito.id },
      transaction: t,
    });

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
    res
      .status(500)
      .json({ message: error.message || "Error al crear la factura" });
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
            {
              model: Inventario,
              include: [{ model: Producto, attributes: ["nombre", "precio"] }],
            },
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
