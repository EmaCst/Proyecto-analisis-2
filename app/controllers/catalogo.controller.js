// controllers/catalogo.controller.js
const db = require("../models");
const Producto = db.productos;
const Inventario = db.inventarios;
const Color = db.colores;
const Talla = db.tallas;

// ✅ Obtener todo el catálogo (productos + colores + tallas + cantidad)
exports.getAll = async (req, res) => {
  try {
    const catalogo = await Producto.findAll({
      include: [
        {
          model: Inventario,
          as: "inventarios",
          include: [
            { model: Color, as: "color", attributes: ["nombre"] },
            { model: Talla, as: "talla", attributes: ["numero"] }
          ],
          attributes: ["cantidad"]
        }
      ]
    });

    res.status(200).json({
      message: "Catálogo obtenido correctamente.",
      data: catalogo
    });
  } catch (error) {
    console.error("❌ Error al obtener el catálogo:", error);
    res.status(500).json({ message: "Error al obtener el catálogo." });
  }
};

// ✅ Obtener un producto por ID (y opcionalmente filtrar por color)
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const { color } = req.query;

    const producto = await Producto.findByPk(id, {
      include: [
        {
          model: Inventario,
          as: "inventarios",
          include: [
            {
              model: Color,
              as: "color",
              attributes: ["nombre"],
              ...(color ? { where: { nombre: color } } : {})
            },
            { model: Talla, as: "talla", attributes: ["numero"] }
          ],
          attributes: ["cantidad"]
        }
      ]
    });

    if (!producto) return res.status(404).json({ message: "Producto no encontrado." });

    res.status(200).json({
      message: "Producto obtenido correctamente.",
      data: producto
    });
  } catch (error) {
    console.error("❌ Error al obtener el producto:", error);
    res.status(500).json({ message: "Error al obtener el producto." });
  }
};
