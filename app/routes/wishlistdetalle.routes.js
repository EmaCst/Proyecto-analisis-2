const express = require("express");
const router = express.Router();
const wishlistDetalle = require("../controllers/wishlistDetalle.controller");

// Agregar producto a la wishlist
router.post("/", wishlistDetalle.agregarAWishlist);

// Obtener productos de la wishlist
router.get("/:wishlistId", wishlistDetalle.obtenerDetallesPorWishlist);

// Pasar producto de wishlist al carrito
router.post("/moverAlCarrito", wishlistDetalle.moverAlCarrito);

// Eliminar producto de la wishlist
router.delete("/:id", wishlistDetalle.eliminarDetalle);

module.exports = router;
