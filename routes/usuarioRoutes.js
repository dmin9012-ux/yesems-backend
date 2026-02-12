const express = require("express");
const router = express.Router();

// Control de consistencia en el nombre del archivo
const usuarioController = require("../controllers/UsuarioController");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

console.log("🔥 UsuarioRoutes: Rutas de administración y suscripción configuradas");

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
    🛡️ ADMINISTRACIÓN (PROTEGIDAS POR AUTH Y ADMIN)
   ===================================================== */

// ⚡ ACTIVACIÓN PREMIUM: Esta debe ir antes de las rutas con :id para evitar conflictos
router.post("/activar-premium-admin", auth, admin, usuarioController.activarSuscripcionAdmin);

// Gestión de usuarios por ID
router.get("/:id", auth, admin, usuarioController.obtenerUsuario);
router.put("/:id", auth, admin, usuarioController.actualizarUsuario);
router.delete("/:id", auth, admin, usuarioController.eliminarUsuario);
router.put("/password/:id", auth, admin, usuarioController.cambiarPassword);

// Listado y creación global
router.get("/", auth, admin, usuarioController.obtenerUsuarios);
router.post("/", auth, admin, usuarioController.crearUsuario);

module.exports = router;