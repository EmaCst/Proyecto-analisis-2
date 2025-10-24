// controllers/factura.controller.js
const db = require("../models");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const Factura = db.facturaEncabezados;
const FacturaDetalle = db.facturaDetalles;
const Envio = db.envios;
const Inventario = db.inventarios;
const Producto = db.productos;
const Carrito = db.carritos;
const CarritoDetalle = db.carritoDetalles;

exports.create = async (req, res) => {
  const { usuarioId, direccionEnvio, paymentMethodId, carritoId } = req.body;

  if (!usuarioId) return res.status(400).json({ message: "Falta usuarioId" });
  if (!paymentMethodId) return res.status(400).json({ message: "Falta paymentMethodId" });
  if (!carritoId) return res.status(400).json({ message: "Falta carritoId" });

  const t = await db.sequelize.transaction();

  try {
    // 1️⃣ Verificar que el carrito pertenezca al usuario
    const carrito = await Carrito.findOne({
      where: { id: carritoId, usuarioId },
      include: [
        {
          model: CarritoDetalle,
          include: [{ model: Inventario, include: [Producto] }],
        },
      ],
    });

    if (!carrito) throw new Error("Carrito no encontrado o no pertenece al usuario");
    if (!carrito.carritoDetalles || carrito.carritoDetalles.length === 0)
      throw new Error("El carrito está vacío");

    let subtotal = 0;

    // 2️⃣ Validar stock y calcular subtotal
    for (const item of carrito.carritoDetalles) {
      const inventario = item.inventario;
      if (!inventario) throw new Error(`Inventario no encontrado para un producto`);
      if (inventario.cantidad < item.cantidad)
        throw new Error(`Stock insuficiente para ${inventario.producto.nombre}`);

      const precio = inventario.producto.precio;
      subtotal += precio * item.cantidad;
    }

    const iva = subtotal * 0.12;
    const total = subtotal + iva;

    // 3️⃣ Crear PaymentIntent con Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: "gtq",
      payment_method: paymentMethodId,
      confirm: true,
    });

    if (paymentIntent.status !== "succeeded")
      throw new Error("El pago no se completó correctamente");

    // 4️⃣ Crear Factura
    const factura = await Factura.create(
      { usuarioId, fecha: new Date(), subtotal, iva, total },
      { transaction: t }
    );

    // 5️⃣ Crear detalles y actualizar inventario
    for (const item of carrito.carritoDetalles) {
      const inventario = item.inventario;
      const precio = inventario.producto.precio;

      await FacturaDetalle.create(
        {
          facturaId: factura.id,
          inventarioId: inventario.id,
          cantidad: item.cantidad,
          precioUnitario: precio,
          subtotal: precio * item.cantidad,
        },
        { transaction: t }
      );

      // Descontar stock
      inventario.cantidad -= item.cantidad;
      await inventario.save({ transaction: t });
    }

    // 6️⃣ Crear envío si hay dirección
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

    // 7️⃣ Vaciar carrito
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
