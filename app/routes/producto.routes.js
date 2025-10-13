const express = require("express");
const router = express.Router();
const ProductoController = require("../controllers/producto.controller.js");

// Crear producto
router.post("/create", ProductoController.create);

// Listar todos los productos
router.get("/", ProductoController.findAll);

// Obtener producto por ID
router.get("/:id", ProductoController.findOne);

// Actualizar producto
router.put("/update/:id", ProductoController.update);

// Eliminar producto
router.delete("/delete/:id", ProductoController.delete);

module.exports = router;
