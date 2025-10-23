const db = require("../models");

// =====================
// Crear un detalle en el carrito
// =====================
exports.create = async (req, res) => {
  try {
    const { carritoId, inventarioId, cantidad } = req.body;

    if (!carritoId || !inventarioId || !cantidad) {
      return res.status(400).json({ mensaje: "Faltan datos obligatorios" });
    }

    // Verificar si ya existe el detalle en el carrito
    const detalleExistente = await db.carritoDetalles.findOne({
      where: { carritoId, inventarioId },
    });

    if (detalleExistente) {
      // Si existe, sumar la cantidad
      detalleExistente.cantidad += cantidad;
      await detalleExistente.save();
      return res.status(200).json(detalleExistente);
    }

    // Crear un nuevo detalle si no existe
    const nuevoDetalle = await db.carritoDetalles.create({
      carritoId,
      inventarioId,
      cantidad,
    });

    res.status(201).json(nuevoDetalle);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al agregar al carrito" });
  }
};


// =====================
// Obtener productos del carrito
// =====================
exports.obtenerDetallesPorCarrito = async (req, res) => {
  try {
    const { carritoId } = req.params;

    const detalles = await db.carritoDetalles.findAll({
      where: { carritoId },
      include: [
        {
          model: db.inventarios,
          as: "inventario",
          include: [
            { model: db.productos, attributes: ["nombre", "precio"] },
            { model: db.tallas, attributes: ["numero"] }, // columna real de tu tabla
            { model: db.colores, attributes: ["nombre"] }, // columna real de tu tabla
          ],
        },
      ],
    });

    if (!detalles.length)
      return res.status(404).json({ mensaje: "No hay productos en el carrito" });

    const resultado = detalles.map((d) => {
      const inv = d.inventario;
      return {
        id: d.id,
        producto: inv.producto.nombre,
        talla: inv.talla.nombre,
        color: inv.color.color,
        cantidad: d.cantidad,
        subtotal: inv.producto.precio * d.cantidad,
      };
    });

    res.json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener detalles" });
  }
};

// =====================
// Eliminar detalle
// =====================
exports.eliminarDetalle = async (req, res) => {
  try {
    const { id } = req.params;

    const eliminado = await db.carritoDetalles.destroy({ where: { id } });

    if (!eliminado)
      return res.status(404).json({ mensaje: "Detalle no encontrado" });

    res.json({ mensaje: "Producto eliminado del carrito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al eliminar detalle" });
  }
};
