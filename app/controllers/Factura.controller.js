// controllers/factura.controller.js
const db = require("../models");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Modelos
const Factura = db.facturaEncabezados;
const FacturaDetalle = db.facturaDetalles;
const Usuario = db.usuarios;
const Envio = db.envios;
const EstadoEnvio = db.estadoEnvios;
const Inventario = db.inventarios;
const Producto = db.productos;
const Carrito = db.carritos;
const CarritoDetalle = db.carritoDetalles;

exports.create = async (req, res) => {
  const { usuarioId, direccionEnvio, paymentMethodId, detalles } = req.body;

  if (!usuarioId) return res.status(400).json({ message: "Falta usuarioId" });
  if (!paymentMethodId) return res.status(400).json({ message: "Falta paymentMethodId" });
  if (!detalles || detalles.length === 0)
    return res.status(400).json({ message: "Falta la lista de detalles del carrito" });

  const t = await db.sequelize.transaction();

  try {
    let subtotal = 0;

    // -----------------------
    // Validar stock y calcular subtotal
    // -----------------------
    for (const item of detalles) {
      const inventario = await Inventario.findByPk(item.inventario_id, {
        include: [{ model: Producto }],
      });

      if (!inventario) throw new Error(`Inventario ${item.inventario_id} no encontrado`);
      if (inventario.cantidad < item.cantidad)
        throw new Error(`Inventario insuficiente para ${inventario.producto.nombre}`);

      item.precioUnitario = inventario.producto.precio;
      item.subtotal = inventario.producto.precio * item.cantidad;
      subtotal += item.subtotal;
    }

    const iva = subtotal * 0.12;
    const total = subtotal + iva;

    // -----------------------
    // Crear PaymentIntent con Stripe
    // -----------------------
    console.log("paymentMethodId recibido:", paymentMethodId, "Total:", total);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // en centavos
      currency: "gtq",
      payment_method: paymentMethodId,
      confirm: true,
    });

    if (paymentIntent.status !== "succeeded") {
      throw new Error("El pago no se completó correctamente");
    }

    // -----------------------
    // Crear Factura
    // -----------------------
    const factura = await Factura.create(
      { usuarioId, fecha: new Date(), subtotal, iva, total },
      { transaction: t }
    );

    // -----------------------
    // Crear Detalles y actualizar inventario
    // -----------------------
    for (const item of detalles) {
      await FacturaDetalle.create(
        {
          facturaId: factura.id,
          inventarioId: item.inventario_id,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          subtotal: item.subtotal,
        },
        { transaction: t }
      );

      // Reducir stock
      const inventario = await Inventario.findByPk(item.inventario_id);
      inventario.cantidad -= item.cantidad;
      await inventario.save({ transaction: t });
    }

    // -----------------------
    // Crear Envío (si hay dirección)
    // -----------------------
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
        { model: Usuario, attributes: ["nombre", "email"] },
        { model: Envio, include: [{ model: EstadoEnvio, attributes: ["nombre"] }] },
        {
          model: FacturaDetalle,
          include: [
            { model: Inventario, include: [{ model: Producto, attributes: ["nombre", "precio"] }] },
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

