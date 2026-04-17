// app/controllers/chat.controller.js
import db from '../models/index.js'; // Importamos desde el index central
import { evaluarConIA } from '../services/openia.service.js';

// Extraemos el modelo Historial (asegúrate que en el index.js lo llamaste 'historiales')
const { historiales, usuarios } = db;

export const handleChatRequest = async (req, res) => {
  try {
    const { mensaje, usuarioId } = req.body;

    // 1. Validaciones iniciales
    if (!mensaje || !usuarioId) {
      return res.status(400).json({ msg: "Falta mensaje o usuarioId 🐺🚫" });
    }

    // 2. Buscamos al usuario en la DB para validar su Rol (opcional)
    const usuarioEncontrado = await usuarios.findByPk(usuarioId);
    
    if (!usuarioEncontrado) {
      return res.status(404).json({ msg: "Ese lobo no está en la manada (Usuario no encontrado)." });
    }

    // Validamos usando 'Rol' con R mayúscula como está en tu Neon
    if (usuarioEncontrado.Rol !== 'cliente' && usuarioEncontrado.Rol !== 'CLIENTE') {
      return res.status(403).json({ 
        msg: "Glitch solo atiende a clientes, los lobos admin tienen su propio panel. 🐺🚫" 
      });
    }

    // 3. Guardar el mensaje del usuario en el historial
    await historiales.create({
      usuarioId: usuarioId,
      role: 'user', // 'user' para OpenAI
      contenido: mensaje
    });

    // 4. Obtener contexto previo (últimos 6 mensajes)
    const historialPrevio = await historiales.findAll({
      where: { usuarioId: usuarioId },
      order: [['createdAt', 'ASC']], // 'ASC' para que vayan en orden cronológico
      limit: 10
    });

    // 5. Llamar a Glitch (IA)
    const respuestaGlitch = await evaluarConIA(mensaje, historialPrevio);

    // 6. Guardar la respuesta de Glitch
    await historiales.create({
      usuarioId: usuarioId,
      role: 'assistant', // 'assistant' para OpenAI
      contenido: respuestaGlitch
    });

    // 7. Responder al cliente
    res.json({ respuesta: respuestaGlitch });

  } catch (error) {
    console.error("ERROR EN GLITCH CONTROLLER:", error);
    res.status(500).json({ 
      msg: "Lo siento, te perdí el rastro... 🐺😔",
      error: error.message 
    });
  }
};