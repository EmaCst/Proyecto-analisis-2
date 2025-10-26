const express = require("express");
const router = express.Router();
const envioController = require("../controllers/envio.controller");

router.put("/:id/transito", envioController.marcarEnTransito);
router.put("/:id/entregado", envioController.marcarEntregado);

module.exports = router;
