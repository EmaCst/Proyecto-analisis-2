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
  const { usuarioId, direccionEnvio, paymentMethodId } = req.body;

  if (!usuarioId) return res.status(400).json({ message: "Falta usuarioId" });
  if (!paymentMethodId) return res.status(400).json({ message: "Falta paymentMethodId" });

  const t = await db.sequelize.transaction();

  try {
    // -----------------------
    // Obtener el carrito del usuario
    // -----------------------
    const carrito = await Carrito.findOne({
      where: { usuarioId },
      include: [
        {
          model: CarritoDetalle,
          include: [{ model: Inventario, include: [{ model: Producto }] }],
        },
      ],
    });

    if (!carrito || carrito.carritoDetalles.length === 0) {
      throw new Error("El carrito está vacío o no existe");
    }

    // -----------------------
    // Calcular subtotal, IVA y total
    // -----------------------
    let subtotal = 0;
    for (const item of carrito.carritoDetalles) {
      subtotal += item.inventario.producto.precio * item.cantidad;
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
      {
        usuarioId,
        fecha: new Date(),
        subtotal,
        iva,
        total,
      },
      { transaction: t }
    );

    // -----------------------
    // Crear Detalles y actualizar inventario
    // -----------------------
    for (const item of carrito.carritoDetalles) {
      const inventario = await Inventario.findByPk(item.inventarioId, {
        include: [{ model: Producto }],
      });

      if (!inventario) throw new Error("Inventario no encontrado");
      if (inventario.cantidad < item.cantidad)
        throw new Error(`Inventario insuficiente para ${inventario.producto.nombre}`);

      await FacturaDetalle.create(
        {
          facturaId: factura.id,
          inventarioId: item.inventarioId,
          cantidad: item.cantidad,
          precioUnitario: inventario.producto.precio,
          subtotal: inventario.producto.precio * item.cantidad,
        },
        { transaction: t }
      );

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

    // -----------------------
    // Vaciar el carrito
    // -----------------------
    await CarritoDetalle.destroy({ where: { carritoId: carrito.id }, transaction: t });

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

