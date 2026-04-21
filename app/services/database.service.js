import db from "../models/index.js";
import { Op } from "sequelize";

// Extraemos los modelos necesarios
const { productos, inventarios, tallas, colores } = db;

export const buscarProductosEnTienda = async (mensajeUsuario) => {
  try {
    // 1. Tokenización: Limpiamos el mensaje para buscar palabras clave
    const palabrasClave = mensajeUsuario
      .toLowerCase()
      .replace(/[?¿!¡,.-]/g, "")
      .split(" ")
      .filter(palabra => palabra.length > 3); // Evitamos "de", "la", "con"

    if (palabrasClave.length === 0) return [];

    // 2. Construcción de condiciones de búsqueda (ILIKE para PostgreSQL)
    const condiciones = palabrasClave.map(palabra => ({
      [Op.or]: [
        { nombre: { [Op.iLike]: `%${palabra}%` } },
        { marca: { [Op.iLike]: `%${palabra}%` } },
        { modelo: { [Op.iLike]: `%${palabra}%` } }
      ]
    }));

    // 3. Búsqueda con asociaciones (Incluye Tallas y Colores)
    const resultados = await productos.findAll({
      where: {
        [Op.or]: condiciones
      },
      include: [
        {
          model: inventarios,
          include: [
            { model: tallas },
            { model: colores }
          ]
        }
      ],
      limit: 5
    });

    return resultados;
  } catch (error) {
    console.error("❌ ERROR EN BUSQUEDA_DB:", error);
    return [];
  }
};