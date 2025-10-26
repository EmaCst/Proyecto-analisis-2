exports.create = async (req, res) => {
  const { usuarioId, direccionEnvio, detalles, promocionId } = req.body;

  // Validar que haya productos
  if (!Array.isArray(detalles) || detalles.length === 0) {
    return res.status(400).json({ message: "⚠ El carrito está vacío." });
  }

  const t = await db.sequelize.transaction();

  try {
    // Calcular subtotal
    let subtotal = 0;
    for (const item of detalles) {
      const inventario = await Inventario.findByPk(item.inventarioId, {
        include: [{ model: Producto }],
      });
      if (!inventario) throw new Error("Inventario no encontrado");

      subtotal += inventario.producto.precio * item.cantidad;
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

    // 🧾 Crear la factura encabezado
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

    // 🧮 Crear detalles y actualizar inventario
    for (const item of detalles) {
      const inventario = await Inventario.findByPk(item.inventarioId, {
        include: [{ model: Producto }],
      });

      if (!inventario) throw new Error("Inventario no encontrado");
      if (inventario.cantidad < item.cantidad)
        throw new Error(`Inventario insuficiente para ${inventario.producto.nombre}`);


      // Crear detalle
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

      // Disminuir inventario
      inventario.cantidad -= item.cantidad;
      await inventario.save({ transaction: t });
    }

    // 🚚 Crear envío simulado
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

    return res.status(201).json({
      message: "Factura creada con éxito (pago simulado)",
      factura,
      envio,
    });
  } catch (error) {
    await t.rollback();
    console.error("ERROR al crear factura:", error);
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
