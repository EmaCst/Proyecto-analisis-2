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

  if (!paymentMethodId) {
    return res.status(400).json({ message: "Falta paymentMethodId" });
  }

  const t = await db.sequelize.transaction();

  try {
    // -----------------------
    // Obtener carrito y sus detalles
    // -----------------------
    const carrito = await Carrito.findOne({ where: { usuarioId } });
    if (!carrito) throw new Error("El carrito está vacío o no existe");

    const detallesCarrito = await CarritoDetalle.findAll({
      where: { carritoId: carrito.id },
      include: [{ model: Inventario, include: [{ model: Producto }] }]
    });

    if (detallesCarrito.length === 0) throw new Error("El carrito está vacío");

    // -----------------------
    // Calcular subtotal y total
    // -----------------------
    let subtotal = 0;
    for (const item of detallesCarrito) {
      const precio = item.inventario.producto.precio;
      subtotal += precio * item.cantidad;
    }
    const iva = subtotal * 0.12;
    const total = subtotal + iva;

    console.log("paymentMethodId recibido:", paymentMethodId, "Total:", total);

    // -----------------------
    // Crear PaymentIntent usando Stripe
    // -----------------------
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: "gtq",
      payment_method: paymentMethodId,
      confirm: true,
    });

    if (paymentIntent.status !== "succeeded") {
      throw new Error("El pago no se completó correctamente");
    }

    // -----------------------
    // Crear factura encabezado
    // -----------------------
    const factura = await Factura.create(
      { usuarioId, fecha: new Date(), subtotal, iva, total },
      { transaction: t }
    );

    // -----------------------
    // Crear detalles de factura y actualizar inventario
    // -----------------------
    for (const item of detallesCarrito) {
      const inv = item.inventario;
      if (inv.cantidad < item.cantidad)
        throw new Error(`Inventario insuficiente para ${inv.producto.nombre}`);

      await FacturaDetalle.create(
        {
          facturaId: factura.id,
          inventarioId: inv.id,
          cantidad: item.cantidad,
          precioUnitario: inv.producto.precio,
          subtotal: inv.producto.precio * item.cantidad,
        },
        { transaction: t }
      );

      inv.cantidad -= item.cantidad;
      await inv.save({ transaction: t });
    }

    // -----------------------
    // Crear envío
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

    // -----------------------
    // Vaciar carrito
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
