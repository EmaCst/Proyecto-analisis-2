const express = require("express");
const router = express.Router();
const SucursalController = require("../controllers/sucursal.controller.js");

// Crear sucursal
router.post("/create", SucursalController.create);

// Listar todas las sucursales
router.get("/", SucursalController.findAll);

module.exports = router;
