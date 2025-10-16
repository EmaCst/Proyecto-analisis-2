const db = require("../models");

// Crear wishlist
exports.create = async (req, res) => {
  try {
    const { usuarioId } = req.body;
    const wishlist = await db.wishlists.create({ usuarioId });
    res.status(201).json(wishlist);
  } catch (error) {
    console.error("Error al crear wishlist:", error);
    res.status(500).json({ mensaje: "Error al crear wishlist" });
  }
};

// Obtener wishlist de un usuario
exports.findByUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const wishlist = await db.wishlists.findOne({
      where: { usuarioId },
    });
    if (!wishlist)
      return res.status(404).json({ mensaje: "Wishlist no encontrada" });

    res.json(wishlist);
  } catch (error) {
    console.error("Error al obtener wishlist:", error);
    res.status(500).json({ mensaje: "Error al obtener wishlist" });
  }
};

// Vaciar wishlist
exports.clear = async (req, res) => {
  try {
    const { id } = req.params;
    await db.wishlistDetalles.destroy({ where: { wishlistId: id } });
    res.json({ mensaje: "Wishlist vaciada" });
  } catch (error) {
    console.error("Error al vaciar wishlist:", error);
    res.status(500).json({ mensaje: "Error al vaciar wishlist" });
  }
};