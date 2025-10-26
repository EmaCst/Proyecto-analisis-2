// controllers/envio.controller.js
const db = require("../models");
const Envio = db.envios;

// Cambiar estado a "En tránsito" (id = 2)
exports.marcarEnTransito = async (req, res) => {
  try {
    const { id } = req.params; // id del envío

    const envio = await Envio.findByPk(id);
    if (!envio) return res.status(404).json({ mensaje: "Envío no encontrado" });

    await envio.update({
      estadoId: 2, // “En tránsito”
      fechaActualizacion: new Date(),
    });

    res.json({
      mensaje: "El envío ha sido marcado como 'En tránsito'",
      envio,
    });
  } catch (error) {
    console.error("Error al actualizar envío a 'En tránsito':", error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
};

// Cambiar estado a "Entregado" (id = 3)
exports.marcarEntregado = async (req, res) => {
  try {
    const { id } = req.params; // id del envío

    const envio = await Envio.findByPk(id);
    if (!envio) return res.status(404).json({ mensaje: "Envío no encontrado" });

    await envio.update({
      estadoId: 3, // “Entregado”
      fechaActualizacion: new Date(),
    });

    res.json({
      mensaje: "El envío ha sido marcado como 'Entregado'",
      envio,
    });
  } catch (error) {
    console.error("Error al actualizar envío a 'Entregado':", error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
};
