// app/services/database.service.js
import db from '../models/index.js'; // Importamos el objeto db del index
const { productos, inventarios, tallas, colores } = db;
import { Op } from 'sequelize';

// DEBE TENER EL 'export' ANTES DE 'const'
export const buscarProductosEnTienda = async (termino) => {
    try {
        const resultados = await productos.findAll({
            where: {
                [Op.or]: [
                    { nombre: { [Op.iLike]: `%${termino}%` } },
                    { marca: { [Op.iLike]: `%${termino}%` } }
                ]
            },
            include: [
                { model: inventarios, include: [tallas, colores] }
            ]
        });
        return resultados;
    } catch (error) {
        console.error("Error en DB Service:", error);
        return [];
    }
};