const db = require("../models");
const Inventario = db.inventarios;

// Crear un inventario
exports.create = async (req, res) => {
  try {
    const { productoId, tallaId, colorId, sucursalId, cantidad } = req.body;

    if (!productoId || !tallaId || !colorId || !sucursalId || !cantidad) {
      return res.status(400).json({ message: "Faltan datos obligatorios." });
    }

    const nuevoInventario = await Inventario.create({
      productoId,
      tallaId,
      colorId,
      sucursalId,
      cantidad,
    });

    res.status(201).json(nuevoInventario);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener todos los inventarios
exports.findAll = async (req, res) => {
  try {
    const inventarios = await Inventario.findAll({
      include: ["producto", "talla", "color", "sucursal"],
    });
    res.json(inventarios);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener un inventario por ID
exports.findOne = async (req, res) => {
  try {
    const inventario = await Inventario.findByPk(req.params.id);
    if (!inventario) return res.status(404).json({ message: "Inventario no encontrado" });
    res.json(inventario);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar inventario
exports.update = async (req, res) => {
  try {
    const [updated] = await Inventario.update(req.body, {
      where: { id: req.params.id },
    });
    if (!updated) return res.status(404).json({ message: "Inventario no encontrado" });
    res.json({ message: "Inventario actualizado correctamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Eliminar inventario
exports.delete = async (req, res) => {
  try {
    const deleted = await Inventario.destroy({
      where: { id: req.params.id },
    });
    if (!deleted) return res.status(404).json({ message: "Inventario no encontrado" });
    res.json({ message: "Inventario eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
