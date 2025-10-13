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

// Obtener carrito de un usuario
exports.findByUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const carrito = await db.carritos.findOne({
      where: { usuarioId }
    });
    if (!carrito) return res.status(404).json({ mensaje: "Carrito no encontrado" });
    res.json(carrito);
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
