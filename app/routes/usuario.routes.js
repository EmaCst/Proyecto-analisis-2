const express = require("express");
const router = express.Router();
const UsuarioController = require("../controllers/usuario.controller.js");

// Rutas de usuarios
router.post("/create", UsuarioController.create);
router.post("/login", UsuarioController.login);

module.exports = router; // exportamos el router directo
