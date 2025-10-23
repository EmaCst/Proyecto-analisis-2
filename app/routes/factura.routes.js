// routes/factura.routes.js
const express = require("express");
const router = express.Router();
const facturaController = require("../controllers/Factura.controller"); // 👈 corregido (minúscula)

// Crear una factura (con Stripe y Envío)
router.post("/", facturaController.create);

// Obtener todas las facturas
router.get("/", facturaController.findAll);

module.exports = (app) => {
  app.use("/api/facturas", router);
};

