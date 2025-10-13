// controllers/estadoEnvio.controller.js
const db = require("../models");
const EstadoEnvio = db.estadoEnvios;

// Crear un nuevo estado
exports.create = async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre) {
      return res.status(400).json({ mensaje: "El nombre del estado es obligatorio" });
    }

    const nuevoEstado = await EstadoEnvio.create({ nombre });
    res.status(201).json(nuevoEstado);
  } catch (error) {
    console.error("Error al crear estado de envío:", error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
};

// Obtener todos los estados
exports.findAll = async (req, res) => {
  try {
    const estados = await EstadoEnvio.findAll();
    res.json(estados);
  } catch (error) {
    console.error("Error al obtener estados de envío:", error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
};

// Actualizar estado
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;

    const estado = await EstadoEnvio.findByPk(id);
    if (!estado) return res.status(404).json({ mensaje: "Estado no encontrado" });

    await estado.update({ nombre });
    res.json({ mensaje: "Estado actualizado correctamente", estado });
  } catch (error) {
    console.error("Error al actualizar estado de envío:", error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
};

// Eliminar estado
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await EstadoEnvio.destroy({ where: { id } });

    if (!eliminado) return res.status(404).json({ mensaje: "Estado no encontrado" });

    res.json({ mensaje: "Estado eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar estado de envío:", error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
};
