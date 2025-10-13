const db = require("../models");

// Obtener productos del carrito
exports.obtenerDetallesPorCarrito = async (req, res) => {
  try {
    const { carritoId } = req.params;
    const detalles = await db.carritoDetalles.findAll({
      where: { carritoId },
      include: [
        {
          model: db.inventarios,
          include: [
            { model: db.productos, attributes: ["nombre"] },
            { model: db.tallas, attributes: ["talla"] },
            { model: db.colores, attributes: ["color"] }
          ],
          attributes: ["precio"]
        }
      ]
    });

    if (!detalles.length) return res.status(404).json({ mensaje: "No hay productos en el carrito" });

    const resultado = detalles.map(d => {
      const inv = d.inventario;
      return {
        id: d.id,
        producto: inv.producto.nombre,
        talla: inv.talla.talla,
        color: inv.color.color,
        precio: inv.precio,
        cantidad: d.cantidad,
        subtotal: inv.precio * d.cantidad
      };
    });

    res.json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener detalles" });
  }
};

// Agregar producto al carrito
exports.agregarAlCarrito = async (req, res) => {
  try {
    const { carritoId, inventarioId, cantidad } = req.body;
    const detalle = await db.carritoDetalles.create({ carritoId, inventarioId, cantidad });
    res.status(201).json(detalle);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al agregar producto al carrito" });
  }
};

// Actualizar cantidad
exports.actualizarCantidad = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad } = req.body;
    const detalle = await db.carritoDetalles.findByPk(id);
    if (!detalle) return res.status(404).json({ mensaje: "Detalle no encontrado" });

    detalle.cantidad = cantidad;
    await detalle.save();
    res.json(detalle);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al actualizar cantidad" });
  }
};

// Eliminar detalle
exports.eliminarDetalle = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await db.carritoDetalles.destroy({ where: { id } });
    if (!eliminado) return res.status(404).json({ mensaje: "Detalle no encontrado" });
    res.json({ mensaje: "Producto eliminado del carrito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al eliminar detalle" });
  }
};
