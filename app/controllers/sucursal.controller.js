const db = require("../models");
const Sucursal = db.sucursales;

exports.create = async (req, res) => {
  try {
    const { nombre, direccion } = req.body;
    if (!nombre || !direccion) return res.status(400).json({ message: "Faltan datos obligatorios" });

    const nuevaSucursal = await Sucursal.create({ nombre, direccion });
    return res.status(201).json({ message: "Sucursal creada", sucursal: nuevaSucursal });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al crear sucursal" });
  }
};

exports.findAll = async (req, res) => {
  try {
    const sucursales = await Sucursal.findAll();
    return res.status(200).json(sucursales);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener sucursales" });
  }
};
