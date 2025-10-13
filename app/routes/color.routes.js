const express = require("express");
const router = express.Router();
const ColorController = require("../controllers/color.controller.js");

// Crear color
router.post("/create", ColorController.create);

// Listar todos los colores
router.get("/", ColorController.findAll);

module.exports = router;
