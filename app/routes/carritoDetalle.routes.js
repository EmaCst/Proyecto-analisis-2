const express = require("express");
const router = express.Router();
const carritoDetalleController = require("../controllers/carritodetalle.controller");

// POST: crear un detalle en el carrito
router.post("/create", carritoDetalleController.create);

// GET: obtener productos del carrito por carritoId
router.get("/carrito/:carritoId", carritoDetalleController.obtenerDetallesPorCarrito);

// DELETE: eliminar un detalle por id
router.delete("/:id", carritoDetalleController.eliminarDetalle);



module.exports = router;
