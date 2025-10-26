const express = require("express");
const router = express.Router();
const envioController = require("../controllers/envio.controller");

// Obtener todos los envíos
router.get("/", envioController.getAllEnvios);

// Obtener todos los envíos de un usuario
router.get("/usuario/:usuarioId", envioController.getEnviosByUsuario);

// Cambiar estado a “En tránsito”
router.put("/:id/transito", envioController.marcarEnTransito);

// Cambiar estado a “Entregado”
router.put("/:id/entregado", envioController.marcarEntregado);

module.exports = router;
