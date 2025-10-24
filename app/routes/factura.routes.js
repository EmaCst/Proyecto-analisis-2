// routes/factura.routes.js
const express = require("express");
const router = express.Router();
const facturaController = require("../controllers/Factura.controller"); // minúscula

router.post("/", facturaController.create);
router.get("/", facturaController.findAll);

module.exports = router;
