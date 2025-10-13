const express = require("express");
const router = express.Router();
const wishlistController = require("../controllers/wishlist.controller");

// Agregar producto a la wishlist
router.post("/", wishlistController.agregarAWishlist);

// Obtener productos de la wishlist
router.get("/:wishlistId", wishlistController.obtenerDetallesPorWishlist);

// Pasar producto de wishlist al carrito
router.post("/moverAlCarrito", wishlistController.moverAlCarrito);

// Eliminar producto de la wishlist
router.delete("/:id", wishlistController.eliminarDetalle);

module.exports = router;
