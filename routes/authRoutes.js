// routes/authRoutes.js
const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

// 🔹 Registro de usuario
router.post("/register", authController.registro);

// 🔹 Verificar cuenta por token
router.get("/verificar/:token", authController.verificar);

// 🔹 Reenviar correo de verificación
router.post("/reenviar-verificacion", authController.reenviarVerificacion);

// 🔹 Login de usuario
router.post("/login", authController.login);

module.exports = router;