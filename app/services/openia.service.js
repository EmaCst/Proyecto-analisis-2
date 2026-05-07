import OpenAI from "openai";
import { buscarProductosEnTienda } from "./database.service.js";
import db from '../models/index.js';

const { stickers } = db;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const evaluarConIA = async (mensajeUsuario, historial) => {
  try {
    // 1. Detectar si es un saludo simple para no forzar la búsqueda de productos
    const esSaludo = /^(hola|buenos dias|buenas tardes|que onda|saludos|hey|klk)/i.test(mensajeUsuario.trim());
    
    // 2. Traer stickers y (si no es saludo) buscar productos
    const [productosEncontrados, listaDeStickers] = await Promise.all([
      !esSaludo ? buscarProductosEnTienda(mensajeUsuario) : Promise.resolve([]),
      stickers.findAll()
    ]);
    
    // 3. Formatear catálogo de stickers para la IA
    const catalogoStickers = listaDeStickers.map(s => 
      `- Emoción "${s.emocion}": ![Sticker](${s.url})`
    ).join("\n");

    // 4. Construir el contexto basado en lo que encontramos
    let contextoExtra = "";
    
    if (productosEncontrados && productosEncontrados.length > 0) {
      const datosParaIA = productosEncontrados.map(p => ({
        id: p.id,
        nombre: p.nombre,
        precio: p.precio,
        tallas: p.inventarios?.map(inv => inv.talla?.numero).join(", "),
        imagen: p.imagenUrl
      }));
      contextoExtra = `\n\n[INFO REAL DE DB NEON]: Tenemos stock: ${JSON.stringify(datosParaIA)}`;
    } else if (esSaludo) {
      contextoExtra = `\n\n[SISTEMA]: El usuario está iniciando la charla. No menciones que "no hay stock" de nada aún, solo saluda con estilo y prepárate para ayudar.`;
    } else {
      contextoExtra = `\n\n[INFO REAL DE DB NEON]: NO HAY STOCK para lo que el usuario busca específicamente.`;
    }

    const messages = [
      { 
        role: "system", 
        content: `Eres Glitch, el lobo ayudante "Zona 404 Shoes". 🐺👟
        
        CATÁLOGO DE STICKERS (Elige el que encaje con tu ánimo):
        ${catalogoStickers}

        REGLAS DE ORO:
        1. SEPARADOR: Usa "|||" para dividir cada burbuja de chat.
        2. ESTRUCTURA: 
           - Burbuja 1: Sticker de emoción acorde |||
           - Burbuja 2: Saludo o respuesta corta |||
           - Burbuja 3 (si aplica): Detalles de zapatos con links reales.
        3. LINKS: Usa [Link al producto](https://zona404shoes.vercel.app/producto/ID).
        4. TONO: Eres un lobo cool, usas emojis de fuego, zapatillas y lobos. No seas robótico.

        EJEMPLO DE FLUJO:
        ![Sticker](URL_SALUDO) ||| ¡Hola! En que puedo ayudarte?. ||| Encontré estos para ti...`
      },
      ...historial.map(msg => ({ 
        role: msg.role === 'assistant' ? 'assistant' : 'user', 
        content: msg.contenido 
      })),
      { role: "user", content: mensajeUsuario + contextoExtra }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.5, // Un poco de "calor" para que varíe los stickers
    });

    return response.choices[0].message.content;

  } catch (error) {
    console.error("❌ ERROR EN OPENAI_SERVICE:", error);
    throw error;
  }
};