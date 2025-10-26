// routes/factura.routes.js
const express = require("express");
const router = express.Router();
const facturaController = require("../controllers/Factura.controller"); // minúscula

router.post("/", facturaController.create);
router.get("/", facturaController.findAll);
 router.get("/usuario/:usuarioId", facturaController.findAllByUsuario)

module.exports = router;
