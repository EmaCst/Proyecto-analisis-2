const db = require("../models");
const Envio = db.envios;
const Factura = db.facturaEncabezados; // Modelo correcto
const Usuario = db.usuarios;
const EstadoEnvio = db.estadoEnvios;

// Obtener todos los envíos
exports.getAllEnvios = async (req, res) => {
  try {
    const envios = await Envio.findAll({
      include: [
        {
          model: Factura,
          include: [Usuario],
        },
        {
          model: EstadoEnvio,
        },
      ],
      order: [["fechaCreacion", "DESC"]],
    });
    res.json(envios);
  } catch (error) {
    console.error("Error al obtener todos los envíos:", error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
};

// Obtener envíos por usuario
exports.getEnviosByUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const envios = await Envio.findAll({
      include: [
        {
          model: Factura,
          where: { usuarioId },
          include: [Usuario],
        },
        {
          model: EstadoEnvio,
        },
      ],
      order: [["fechaCreacion", "DESC"]],
    });

    if (envios.length === 0)
      return res
        .status(404)
        .json({ mensaje: "El usuario no tiene envíos registrados" });

    res.json(envios);
  } catch (error) {
    console.error("Error al obtener envíos por usuario:", error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
};

// Cambiar estado a “En tránsito”
exports.marcarEnTransito = async (req, res) => {
  try {
    const { id } = req.params;
    const envio = await Envio.findByPk(id);
    if (!envio) return res.status(404).json({ mensaje: "Envío no encontrado" });

    await envio.update({
      estadoId: 3, // En tránsito
      fechaActualizacion: new Date(),
    });

    res.json({ mensaje: "Envío marcado como 'En tránsito'", envio });
  } catch (error) {
    console.error("Error al marcar envío en tránsito:", error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
};

// Cambiar estado a “Entregado”
exports.marcarEntregado = async (req, res) => {
  try {
    const { id } = req.params;
    const envio = await Envio.findByPk(id);
    if (!envio) return res.status(404).json({ mensaje: "Envío no encontrado" });

    await envio.update({
      estadoId: 4, // Entregado
      fechaActualizacion: new Date(),
    });

    res.json({ mensaje: "Envío marcado como 'Entregado'", envio });
  } catch (error) {
    console.error("Error al marcar envío como entregado:", error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
};
