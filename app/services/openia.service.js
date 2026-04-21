// app/services/openia.service.js
import OpenAI from "openai";
import { buscarProductosEnTienda } from "./database.service.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const evaluarConIA = async (mensajeUsuario, historial) => {
  try {
    const productosEncontrados = await buscarProductosEnTienda(mensajeUsuario);
    
    let contextoExtra = "";
    if (productosEncontrados && productosEncontrados.length > 0) {
      const datosParaIA = productosEncontrados.map(p => ({
        id: p.id,
        nombre: p.nombre,
        precio: p.precio,
        tallas: p.inventarios?.map(inv => inv.talla?.numero).join(", "),
        imagen: p.imagenUrl
      }));
      contextoExtra = `\n\n[INFO REAL DE DB NEON]: ${JSON.stringify(datosParaIA)}`;
    } else {
      contextoExtra = `\n\n[INFO REAL DE DB NEON]: NO HAY STOCK.`;
    }

    const messages = [
      { 
        role: "system", 
        content: `Eres Glitch, el lobo alfa y asesor experto de "Zona 404 Shoes". 🐺👟
        
        REGLAS DE FORMATO CRÍTICAS:
        1. Debes usar el delimitador "|||" para separar cada mensaje. Si no lo usas, el sistema fallará.
        2. Estructura de respuesta:
           Mensaje 1: Introducción |||
           Mensaje 2: Info del primer Zapato |||
           Mensaje 3: Info del segundo Zapato |||
           Mensaje 4: Cierre/Pregunta
        3. Dentro de cada zapato, el link y la imagen deben ir SEPARADOS. No metas la imagen dentro del link.
        
        Tus reglas de negocio:
        - Solo stock real de [INFO REAL DE DB NEON].
        - No reservaciones, solo compras directas.
        - Tono cool, alfa y emojis (🔥, 👟, 🐺).

        EJEMPLO DE RESPUESTA (SIGUE ESTE MODELO EXACTO):
        Aquí tienes los modelos disponibles: ||| 
        *Nombre del Zapato* \n Precio: Q.900 \n Tallas: 10, 9 \n ![Imagen](URL) \n [Link al producto](https://zona404shoes.vercel.app/producto/ID) ||| 
        🔥 ¿Te interesa alguno?`
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
      temperature: 0.2, // Temperatura baja para que no olvide poner los "|||"
    });

    return response.choices[0].message.content;

  } catch (error) {
    console.error("❌ ERROR EN OPENAI_SERVICE:", error);
    throw error;
  }
};