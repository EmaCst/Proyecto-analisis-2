import { Router } from 'express';
// AGREGA 'obtenerHistorialPorUsuario' dentro de las llaves del import:
import { handleChatRequest, obtenerHistorialPorUsuario } from '../controllers/chat.controller.js';

const router = Router();

// Esta es la ruta para enviar mensajes: /api/chat/mensaje
router.post('/mensaje', handleChatRequest);

// Esta es la ruta para recuperar el historial: /api/chat/historial/:usuarioId
router.get("/historial/:usuarioId", obtenerHistorialPorUsuario);

export default router;