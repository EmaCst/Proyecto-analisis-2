const db = require("../models");
const Rol = db.roles;

// Crear un nuevo rol
exports.create = async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({ message: "El nombre del rol es requerido." });
    }

    const nuevoRol = await Rol.create({ nombre });
    res.status(201).json(nuevoRol);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener todos los roles
exports.findAll = async (req, res) => {
  try {
    const roles = await Rol.findAll();
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener un rol por ID
exports.findOne = async (req, res) => {
  try {
    const rol = await Rol.findByPk(req.params.id);
    if (!rol) return res.status(404).json({ message: "Rol no encontrado." });
    res.json(rol);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar un rol
exports.update = async (req, res) => {
  try {
    const rol = await Rol.findByPk(req.params.id);
    if (!rol) return res.status(404).json({ message: "Rol no encontrado." });

    await rol.update(req.body);
    res.json({ message: "Rol actualizado correctamente.", rol });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Eliminar un rol
exports.delete = async (req, res) => {
  try {
    const rol = await Rol.findByPk(req.params.id);
    if (!rol) return res.status(404).json({ message: "Rol no encontrado." });

    await rol.destroy();
    res.json({ message: "Rol eliminado correctamente." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
    