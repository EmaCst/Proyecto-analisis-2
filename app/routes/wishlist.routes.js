const express = require("express");
const router = express.Router();
const wishlistController = require("../controllers/wishlist.controller");

// Crear, obtener y limpiar wishlist
router.post("/create", wishlistController.create);
router.get("/usuario/:usuarioId", wishlistController.findByUsuario);
router.delete("/clear/:id", wishlistController.clear);

module.exports = router;