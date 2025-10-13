// controllers/usuario.controller.js
const db = require("../models");
const Usuario = db.usuarios;
const Rol = db.roles;
const Carrito = db.carritos;
const Wishlist = db.wishlists;
const bcrypt = require("bcryptjs");

// Crear usuario
exports.create = async (req, res) => {
  console.log(req.body);
  try {
    const { nombre, email, contrasena, rolId, direccion, telefono } = req.body;

    // Validación de campos obligatorios
    if (!nombre || !email || !contrasena || !rolId) {
      return res.status(400).json({ message: "Faltan datos obligatorios." });
    }

    // Revisar si el email ya existe
    const usuarioExistente = await Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(400).json({ message: "El email ya está registrado." });
    }

    // Revisar si el rol existe
    const rol = await Rol.findByPk(rolId);
    if (!rol) {
      return res.status(400).json({ message: "El rol no existe." });
    }

    // Hash de la contraseña
    const hash = await bcrypt.hash(contrasena, 10);

    // Crear usuario
    const nuevoUsuario = await Usuario.create({
      nombre,
      email,
      contrasena: hash,
      rolId,
      direccion: direccion || null,
      telefono: telefono || null
    });

// Crear carrito y wishlist ligados al usuario
const carrito = await Carrito.create({ usuarioId: nuevoUsuario.id });
const wishlist = await Wishlist.create({ usuarioId: nuevoUsuario.id });


    return res.status(201).json({ 
      message: "Usuario creado correctamente.",
      usuario: {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rolId: nuevoUsuario.rolId
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al crear usuario." });
  }
};


// Login de usuario
exports.login = async (req, res) => {
  try {
    const { email, contrasena } = req.body;

    if (!email || !contrasena) {
      return res.status(400).json({ message: "Faltan datos obligatorios." });
    }

    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    const esValido = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!esValido) {
      return res.status(401).json({ message: "Contraseña incorrecta." });
    }

    // Aquí podrías generar un token JWT si quieres
    return res.status(200).json({ message: "Login exitoso." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error en login." });
  }
};
