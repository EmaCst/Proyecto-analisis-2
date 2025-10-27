const express = require("express");
const router = express.Router(); // ✅ define router primero
const usuarioController = require("../controllers/usuario.controller.js");

// 📌 Rutas de usuario
router.post("/create", usuarioController.create);
router.post("/login", usuarioController.login);
router.get("/", usuarioController.getAll);
router.get("/:id", usuarioController.getById);

module.exports = router; // ✅ exporta correctamente
