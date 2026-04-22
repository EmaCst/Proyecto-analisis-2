import db from '../models/index.js';
import { evaluarConIA } from '../services/openia.service.js';

const { historiales, usuarios } = db;

// Función para enviar mensajes
export const handleChatRequest = async (req, res) => {
  try {
    const { mensaje, usuarioId } = req.body;

    if (!mensaje || !usuarioId) {
      return res.status(400).json({ msg: "Falta mensaje o usuarioId 🐺🚫" });
    }

    const usuarioEncontrado = await usuarios.findByPk(usuarioId);
    if (!usuarioEncontrado) {
      return res.status(404).json({ msg: "Usuario no encontrado." });
    }

    await historiales.create({
      usuarioId: usuarioId,
      role: 'user',
      contenido: mensaje
    });

    const historialPrevio = await historiales.findAll({
      where: { usuarioId: usuarioId },
      order: [['createdAt', 'DESC']],
      limit: 15
    });

    const respuestaCompleta = await evaluarConIA(mensaje, historialPrevio.reverse());

    const mensajesIndividuales = respuestaCompleta
      .split('|||')
      .map(msg => msg.trim())
      .filter(msg => msg.length > 0);

    for (const texto of mensajesIndividuales) {
      await historiales.create({
        usuarioId: usuarioId,
        role: 'assistant',
        contenido: texto
      });
    }

    res.json({ respuestas: mensajesIndividuales });

  } catch (error) {
    console.error("ERROR EN CHAT CONTROLLER:", error);
    res.status(500).json({ msg: "Lo siento, te perdí el rastro... 🐺😔" });
  }
};

// Función para recuperar historial (LA QUE TE DA ERROR)
export const obtenerHistorialPorUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const historial = await historiales.findAll({
      where: { usuarioId: usuarioId },
      order: [['createdAt', 'ASC']], 
      attributes: ['role', 'contenido', 'createdAt']
    });

    res.json({ mensajes: historial || [] });

  } catch (error) {
    console.error("❌ ERROR AL RECUPERAR HISTORIAL:", error);
    res.status(500).json({ msg: "No pude olfatear tus mensajes antiguos... 🐺" });
  }
};