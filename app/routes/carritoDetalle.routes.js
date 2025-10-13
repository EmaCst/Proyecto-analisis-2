const express = require("express");
const router = express.Router();
const carritoDetalle = require("../controllers/carritodetalle.controller");

router.post("/", carritoDetalle.agregarAlCarrito);
router.get("/:carritoId", carritoDetalle.obtenerDetallesPorCarrito);
router.put("/:id", carritoDetalle.actualizarCantidad);
router.delete("/:id", carritoDetalle.eliminarDetalle);

module.exports = router;
