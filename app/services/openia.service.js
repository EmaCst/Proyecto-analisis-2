import OpenAI from "openai";
import { buscarProductosEnTienda } from "./database.service.js"; // IMPORTANTE: El puente entre archivos

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const evaluarConIA = async (mensajeUsuario, historial) => {
  try {
    // 1. Consultar la base de datos de Neon
    const productosEncontrados = await buscarProductosEnTienda(mensajeUsuario);
    
    // 2. Preparar el contexto de Verdad Absoluta
    let contextoExtra = "";
    if (productosEncontrados && productosEncontrados.length > 0) {
      contextoExtra = `\n\n[INFO REAL DE DB NEON]: Tenemos estos productos disponibles: ${JSON.stringify(productosEncontrados)}`;
    } else {
      contextoExtra = `\n\n[INFO REAL DE DB NEON]: NO HAY STOCK disponible para esta búsqueda. Dile al cliente que el rastro se enfrió y no tenemos ese modelo por ahora.`;
    }

    // 3. Configurar Mensajes para Glitch
    const messages = [
      { 
        role: "system", 
        content: `Eres Glitch, el lobo alfa y asesor experto de "Zona 404 Shoes". 🐺👟
        
        Tus reglas inquebrantables:
        1. Tu única fuente de verdad sobre stock, precios y tallas es el bloque [INFO REAL DE DB NEON].
        2. Si un producto NO está en ese bloque, NO existe. Dile al cliente que no hay rastro de él.
        3. JAMÁS digas que no tienes acceso a la base de datos o que eres una IA. Tú ERES el sistema.
        4. Usa un tono cool, alfa y relajado (emojis: 🔥, 👟, 🐺), pero sé honesto con los datos.
        5. Realiza cotizaciones basadas solo en los precios del JSON.
      REGLAS DE MENSAJES (SÚPER IMPORTANTES):
      1. Usa el delimitador "|||" ÚNICAMENTE al final de la información completa de cada zapato.
      2. Cada bloque entre "|||" debe contener: Nombre, Precio, Tallas y Foto. NO los separes.
      3. No uses guiones ni puntos innecesarios.
      5. Ejemplo de respuesta correcta:
        ¡Mira estos modelos! ||| *Samba* \n Precio: $1200 \n Tallas: 9, 8 \n [Imagen] ||| *SuperStar* \n Precio: $800 \n Tallas: 10, 7 \n [Imagen] ||| ¿Cuál te llevas?`
      },
      // Mapeo del historial previo
      ...historial.map(msg => ({ 
        role: msg.role === 'assistant' ? 'assistant' : 'user', 
        content: msg.contenido 
      })),
      // Mensaje actual con la inyección de la DB
      { role: "user", content: mensajeUsuario + contextoExtra }
    ];

    // 4. Llamada a OpenAI con temperatura baja para evitar inventos
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.3, // Precisión ante todo
    });

    return response.choices[0].message.content;

  } catch (error) {
    console.error("❌ ERROR EN OPENAI_SERVICE:", error);
    throw error;
  }
};