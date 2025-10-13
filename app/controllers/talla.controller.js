const db = require("../models");
const Talla = db.tallas;

exports.create = async (req, res) => {
  try {
    const { numero } = req.body;
    if (!numero) return res.status(400).json({ message: "Falta el nombre de la talla" });

    const nuevaTalla = await Talla.create({ numero });
    return res.status(201).json({ message: "Talla creada", talla: nuevaTalla });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al crear talla" });
  }
};

exports.findAll = async (req, res) => {
  try {
    const tallas = await Talla.findAll();
    return res.status(200).json(tallas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener tallas" });
  }
};
