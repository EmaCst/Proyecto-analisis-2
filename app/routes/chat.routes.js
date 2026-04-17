// routes/chat.routes.js
import { Router } from 'express';
import { handleChatRequest } from '../controllers/chat.controller.js';

const router = Router();

// Esta es la ruta final: /api/chat/mensaje
router.post('/mensaje', handleChatRequest);

export default router;