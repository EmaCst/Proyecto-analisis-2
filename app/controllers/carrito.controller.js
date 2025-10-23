const db = require("../models");

// Crear carrito
exports.create = async (req, res) => {
  try {
    const { usuarioId } = req.body;
    const carrito = await db.carritos.create({ usuarioId });
    res.status(201).json(carrito);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al crear carrito" });
  }
};

// Obtener carrito de un usuario junto con sus detalles
exports.findByUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const carrito = await db.carritos.findOne({
      where: { usuarioId },
      include: [
        {
          model: db.carritoDetalles,
          as: "carritoDetalles",
          include: [
            {
              model: db.inventarios,
              as: "inventario",
              include: [
                { model: db.productos, attributes: ["nombre"] },
                { model: db.tallas, attributes: ["talla"] },
                { model: db.colores, attributes: ["color"] },
              ],
              attributes: ["precio"],
            },
          ],
        },
      ],
    });

    if (!carrito) return res.status(404).json({ mensaje: "Carrito no encontrado" });

    const detalles = carrito.carritoDetalles.map((d) => {
      const inv = d.inventario;
      return {
        id: d.id,
        producto: inv.producto.nombre,
        talla: inv.talla.talla,
        color: inv.color.color,
        precio: inv.precio,
        cantidad: d.cantidad,
        subtotal: inv.precio * d.cantidad,
      };
    });

    res.json({ carritoId: carrito.id, usuarioId: carrito.usuarioId, detalles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener carrito" });
  }
};

// Vaciar carrito
exports.clear = async (req, res) => {
  try {
    const { id } = req.params;
    await db.carritoDetalles.destroy({ where: { carritoId: id } });
    res.json({ mensaje: "Carrito vaciado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al vaciar carrito" });
  }
};
