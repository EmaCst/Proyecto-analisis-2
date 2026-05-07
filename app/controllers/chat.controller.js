import db from '../models/index.js';
import { evaluarConIA } from '../services/openia.service.js';

const { historiales, usuarios } = db;

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

    // 1. Guardar mensaje del usuario
    await historiales.create({
      usuarioId: usuarioId,
      role: 'user',
      contenido: mensaje
    });

    // 2. Obtener historial (Traemos los últimos 20 para tener buen contexto de stickers + texto)
    const historialPrevio = await historiales.findAll({
      where: { usuarioId: usuarioId },
      order: [['createdAt', 'DESC']],
      limit: 20 
    });

    // IMPORTANTE: reverse() para que la IA reciba: [viejo, ..., nuevo]
    const respuestaCompleta = await evaluarConIA(mensaje, historialPrevio.reverse());

    // 3. Fragmentar respuesta (Sticker ||| Texto ||| Producto)
    const mensajesIndividuales = respuestaCompleta
      .split('|||')
      .map(msg => msg.trim())
      .filter(msg => msg.length > 0);

    // 4. Guardar cada fragmento por separado
    for (const texto of mensajesIndividuales) {
      await historiales.create({
        usuarioId: usuarioId,
        role: 'assistant',
        contenido: texto
      });
    }

    // 5. Enviar al front
    res.json({ respuestas: mensajesIndividuales });

  } catch (error) {
    console.error("ERROR EN CHAT CONTROLLER:", error);
    res.status(500).json({ msg: "Lo siento, te perdí el rastro... 🐺😔" });
  }
};

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