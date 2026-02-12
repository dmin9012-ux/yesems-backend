const express = require("express");
const router = express.Router();

// Importación del controlador y middlewares
const usuarioController = require("../controllers/UsuarioController");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

console.log("🔥 UsuarioRoutes cargado y configurado");

/* =====================================================
    🔐 RECUPERACIÓN DE CONTRASEÑA (Públicas)
   ===================================================== */
router.post("/password/forgot", usuarioController.solicitarResetPasswordCode);
router.post("/password/verify-code", usuarioController.verificarResetPasswordCode);
router.post("/password/reset", usuarioController.resetPasswordConCodigo);

/* =====================================================
    👤 USUARIO AUTENTICADO
   ===================================================== */
router.get("/perfil/me", auth, usuarioController.obtenerPerfil);
router.put("/perfil/me", auth, usuarioController.actualizarMiPerfil);
router.put("/perfil/password", auth, usuarioController.cambiarMiPassword);
router.delete("/perfil/me", auth, usuarioController.eliminarMiCuenta);

/* =====================================================
    💳 SUSCRIPCIÓN DEL USUARIO
   ===================================================== */
router.get("/suscripcion", auth, usuarioController.estadoSuscripcion);

/* =====================================================
    🛡️ ADMINISTRACIÓN (SOLO ADMIN)
   ===================================================== */

// 1️⃣ RUTAS ESTÁTICAS (Deben ir primero)
// ✅ Activar suscripción manualmente (1 hora automática según controlador)
router.post("/activar-premium-admin", auth, admin, usuarioController.activarSuscripcionAdmin);

// ✅ Obtener todos los usuarios y crear nuevo
router.get("/", auth, admin, usuarioController.obtenerUsuarios);
router.post("/", auth, admin, usuarioController.crearUsuario);

// 2️⃣ RUTAS DINÁMICAS (Con :id, van al final)
router.get("/:id", auth, admin, usuarioController.obtenerUsuario);
router.put("/:id", auth, admin, usuarioController.actualizarUsuario);
router.delete("/:id", auth, admin, usuarioController.eliminarUsuario);
router.put("/password/:id", auth, admin, usuarioController.cambiarPassword);

module.exports = router;