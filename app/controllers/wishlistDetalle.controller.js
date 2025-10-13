const db = require("../models");

// 🔹 Obtener todos los productos de la wishlist (por wishlistId)
exports.obtenerDetallesPorWishlist = async (req, res) => {
  try {
    const { wishlistId } = req.params;

    const detalles = await db.wishlistDetalles.findAll({
      where: { wishlistId },
      include: [
        {
          model: db.inventarios,
          include: [
            { model: db.productos, attributes: ["nombre"] },
            { model: db.tallas, attributes: ["talla"] },
            { model: db.colores, attributes: ["color"] },
          ],
          attributes: ["precio"],
        },
      ],
    });

    if (!detalles.length) {
      return res.status(404).json({ mensaje: "No hay productos en esta wishlist" });
    }

    const resultado = detalles.map((detalle) => {
      const inv = detalle.inventario;
      return {
        id: detalle.id,
        producto: inv.producto.nombre,
        talla: inv.talla.talla,
        color: inv.color.color,
        precio: inv.precio,
        cantidad: detalle.cantidad ?? 1,
        subtotal: inv.precio * (detalle.cantidad ?? 1),
      };
    });

    res.json(resultado);
  } catch (error) {
    console.error("Error al obtener los detalles de wishlist:", error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
};

// 🔹 Agregar producto a wishlist
exports.agregarAWishlist = async (req, res) => {
  try {
    const { wishlistId, inventarioId } = req.body;

    const detalle = await db.wishlistDetalles.create({
      wishlistId,
      inventarioId,
    });

    res.status(201).json(detalle);
  } catch (error) {
    console.error("Error al agregar producto a wishlist:", error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
};

// 🔹 Eliminar producto de la wishlist
exports.eliminarDetalle = async (req, res) => {
  try {
    const { id } = req.params;

    const eliminado = await db.wishlistDetalles.destroy({ where: { id } });
    if (!eliminado) return res.status(404).json({ mensaje: "Detalle no encontrado" });

    res.json({ mensaje: "Producto eliminado de la wishlist" });
  } catch (error) {
    console.error("Error al eliminar detalle de wishlist:", error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
};

// 🔹 Pasar un producto de la wishlist al carrito
exports.moverAlCarrito = async (req, res) => {
  try {
    const { detalleId, carritoId, cantidad } = req.body;

    const detalle = await db.wishlistDetalles.findByPk(detalleId);
    if (!detalle) return res.status(404).json({ mensaje: "Detalle no encontrado" });

    await db.carritoDetalles.create({
      carritoId,
      inventarioId: detalle.inventarioId,
      cantidad: cantidad ?? 1,
    });

    await detalle.destroy();

    res.json({ mensaje: "Producto movido al carrito" });
  } catch (error) {
    console.error("Error al mover producto al carrito:", error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
};
