const express = require("express");
const router = express.Router();
const enviosController = require("../controllers/envio.controller.js");

// Obtener todos los envíos
router.get("/", enviosController.getAllEnvios);

// Obtener envíos por usuario
router.get("/usuario/:usuarioId", enviosController.getEnviosByUsuario);

// Cambiar estado a "En tránsito"
router.put("/transito/:id", enviosController.marcarEnTransito);

// Cambiar estado a "Entregado"
router.put("/entregado/:id", enviosController.marcarEntregado);

module.exports = router;
