const db = require("../models");
const Promocion = db.promociones;

// Crear promoción
exports.create = async (req, res) => {
  try {
    const { nombre, descripcion, descuento, fechaInicio, fechaFin } = req.body;
    if (!nombre || !descuento || !fechaInicio || !fechaFin) {
      return res.status(400).json({ message: "Faltan datos obligatorios." });
    }

    const nuevaPromocion = await Promocion.create({
      nombre,
      descripcion,
      descuento,
      fechaInicio,
      fechaFin,
    });

    res.status(201).json(nuevaPromocion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener todas las promociones
exports.findAll = async (req, res) => {
  try {
    const promociones = await Promocion.findAll();
    res.json(promociones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener promoción por ID
exports.findOne = async (req, res) => {
  try {
    const promo = await Promocion.findByPk(req.params.id);
    if (!promo) return res.status(404).json({ message: "Promoción no encontrada" });
    res.json(promo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar promoción
exports.update = async (req, res) => {
  try {
    const [updated] = await Promocion.update(req.body, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ message: "Promoción no encontrada" });
    res.json({ message: "Promoción actualizada correctamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Eliminar promoción
exports.delete = async (req, res) => {
  try {
    const deleted = await Promocion.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: "Promoción no encontrada" });
    res.json({ message: "Promoción eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
