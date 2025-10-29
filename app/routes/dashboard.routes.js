module.exports = app => {
  const dashboard = require("../controllers/dashboard.controller.js");
  const router = require("express").Router();

  // Endpoint para obtener las ventas por sucursal
  router.get("/ventas-por-sucursal", dashboard.getVentasPorSucursal);

  // 🔹 NUEVO: Endpoint para ventas por tiempo
  router.get("/ventas-por-tiempo", dashboard.getVentasPorTiempo);

  // GET /api/dashboard/pares-tiempo
  router.get("/pares-por-tiempo", dashboard.getParesVendidosPorTiempo);

  app.use("/api/dashboard", router);
};