// services/openia.service.js
import OpenAI from "openai";
import db from "../models/index.js"; // Importación del objeto centralizado
import { buscarProductosEnTienda } from "./database.service.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Extraemos los modelos del objeto db que cargó el index.js
const { historiales } = db; 

export const evaluarConIA = async (mensajeUsuario, historial) => {
  
  // 1. Mapeo para OpenAI (msg.role debe ser 'user' o 'assistant')
  const messages = [
    { 
      role: "system", 
      content: `Eres Glitch, un lobo cool y alfa, asesor experto de "Zona 404 Shoes". 
      Tu objetivo es vender y ayudar. Usa emojis (🐺, 👟, 🔥), sé relajado pero no pierdas el respeto. 
      Si un cliente pregunta por stock o precios, usa SIEMPRE la información real que se te proporcione.
      Si no sabes algo, di que "el rastro se enfrió", pero ofrece ayuda.
      realiza cotizaciones automaticas, Haz recomendaciones relacionadas y cosas que el cliente tal vez le gustaria agregar.`
    },
    // Mapeamos el historial que viene de la DB al formato de OpenAI
    ...historial.map(msg => ({ 
        role: msg.role === 'assistant' ? 'assistant' : 'user', 
        content: msg.contenido 
    })),
    { role: "user", content: mensajeUsuario }
  ];

  // 2. Inyección de Contexto desde la DB
  let contextoExtra = "";
  const disparadores = ["talla", "precio", "disponible", "hay", "busco"];
  
  if (disparadores.some(p => mensajeUsuario.toLowerCase().includes(p))) {
     const productos = await buscarProductosEnTienda(mensajeUsuario);
     contextoExtra = `\n\n[INFO REAL DE DB NEON]: ${JSON.stringify(productos)}`;
     messages[messages.length - 1].content += contextoExtra;
  }

  // 3. Llamada a OpenAI
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: messages,
    temperature: 0.8,
  });

  return response.choices[0].message.content;
};