const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

console.log("AUTH CONTROLLER:", authController);

// Registro
router.post("/register", authController.registro);

// Verificar cuenta
router.get("/verificar/:token", authController.verificar);

// Reenviar verificación
router.post("/reenviar-verificacion", authController.reenviarVerificacion);

// Login
router.post("/login", authController.login);

module.exports = router;