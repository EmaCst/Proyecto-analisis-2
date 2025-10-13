const express = require("express");
const router = express.Router();
const carritoController = require("../controllers/carrito.controller");

// CRUD Carrito
router.post("/", carritoController.create);
router.get("/usuario/:usuarioId", carritoController.findByUsuario);
router.delete("/clear/:id", carritoController.clear);

module.exports = router;
