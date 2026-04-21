import db from '../models/index.js';
import { evaluarConIA } from '../services/openia.service.js';

const { historiales, usuarios } = db;

export const handleChatRequest = async (req, res) => {
  try {
    const { mensaje, usuarioId } = req.body;

    if (!mensaje || !usuarioId) {
      return res.status(400).json({ msg: "Falta mensaje o usuarioId 🐺🚫" });
    }

    // 1. Validamos al usuario
    const usuarioEncontrado = await usuarios.findByPk(usuarioId);
    if (!usuarioEncontrado) {
      return res.status(404).json({ msg: "Usuario no encontrado." });
    }

    // 2. Guardamos el mensaje del usuario
    await historiales.create({
      usuarioId: usuarioId,
      role: 'user',
      contenido: mensaje
    });

    // 3. Obtenemos historial (Subimos el límite a 15 para no perder contexto)
    const historialPrevio = await historiales.findAll({
      where: { usuarioId: usuarioId },
      order: [['createdAt', 'DESC']],
      limit: 15
    });

    // 4. Llamamos a Glitch
    const respuestaCompleta = await evaluarConIA(mensaje, historialPrevio.reverse());

    // --- LOGICA DE FRAGMENTACIÓN ---
    // Dividimos por el delimitador ||| que configuramos en el prompt
    const mensajesIndividuales = respuestaCompleta
      .split('|||')
      .map(msg => msg.trim())
      .filter(msg => msg.length > 0);

    // 5. Guardamos CADA mensaje de Glitch como un registro nuevo
    for (const texto of mensajesIndividuales) {
      await historiales.create({
        usuarioId: usuarioId,
        role: 'assistant',
        contenido: texto
      });
    }

    // 6. Enviamos el array de respuestas al cliente
    res.json({ respuestas: mensajesIndividuales });

  } catch (error) {
    console.error("ERROR EN CHAT CONTROLLER:", error);
    res.status(500).json({ msg: "Lo siento, te perdí el rastro... 🐺😔" });
  }
};