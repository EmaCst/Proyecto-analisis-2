const db = require("../models");
const Color = db.colores;

exports.create = async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ message: "Falta el nombre del color" });

    const nuevoColor = await Color.create({ nombre });
    return res.status(201).json({ message: "Color creado", color: nuevoColor });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al crear color" });
  }
};

exports.findAll = async (req, res) => {
  try {
    const colores = await Color.findAll();
    return res.status(200).json(colores);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener colores" });
  }
};
