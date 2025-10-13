const express = require("express");
const router = express.Router();
const TallaController = require("../controllers/talla.controller.js");

// Crear talla
router.post("/create", TallaController.create);

// Listar todas las tallas
router.get("/", TallaController.findAll);

module.exports = router;
