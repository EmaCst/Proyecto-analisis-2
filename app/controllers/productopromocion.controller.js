const db = require("../models");
const ProductoPromocion = db.productoPromociones;

// Crear relación producto-promoción
exports.create = async (req, res) => {
  try {
    const { productoId, promocionId } = req.body;
    if (!productoId || !promocionId) {
      return res.status(400).json({ message: "Faltan datos obligatorios." });
    }

    const nuevaRelacion = await ProductoPromocion.create({ productoId, promocionId });
    res.status(201).json(nuevaRelacion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener todas las relaciones
exports.findAll = async (req, res) => {
  try {
    const relaciones = await ProductoPromocion.findAll({
      include: ["producto", "promocion"],
    });
    res.json(relaciones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Eliminar relación
exports.delete = async (req, res) => {
  try {
    const deleted = await ProductoPromocion.destroy({
      where: { id: req.params.id },
    });
    if (!deleted) return res.status(404).json({ message: "Relación no encontrada" });
    res.json({ message: "Relación eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
