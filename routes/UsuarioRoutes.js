const express = require("express");
const router = express.Router();

const usuarioController = require("../controllers/UsuarioController");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

console.log("🔥 UsuarioRoutes cargado");

/* =====================================================
   🔐 RECUPERACIÓN DE CONTRASEÑA (RUTAS PÚBLICAS)
===================================================== */

/**
 * 1️⃣ Solicitar código de recuperación (6 dígitos)
 * Body: { email }
 */
router.post(
    "/password/forgot",
    usuarioController.solicitarResetPasswordCode
);

/**
 * 2️⃣ Verificar código recibido por correo
 * Body: { email, code }
 */
router.post(
    "/password/verify-code",
    usuarioController.verificarResetPasswordCode
);

/**
 * 3️⃣ Restablecer contraseña usando código válido
 * Body: { email, code, newPassword }
 */
router.post(
    "/password/reset",
    usuarioController.resetPasswordConCodigo
);

/* =====================================================
   👤 USUARIO AUTENTICADO
===================================================== */

/**
 * Obtener mi perfil
 */
router.get(
    "/perfil/me",
    auth,
    usuarioController.obtenerPerfil
);

/**
 * Actualizar mis datos
 */
router.put(
    "/perfil/me",
    auth,
    usuarioController.actualizarMiPerfil
);

/**
 * Cambiar mi contraseña (estando logueado)
 */
router.put(
    "/perfil/password",
    auth,
    usuarioController.cambiarMiPassword
);

/**
 * Eliminar mi cuenta
 */
router.delete(
    "/perfil/me",
    auth,
    usuarioController.eliminarMiCuenta
);

/* =====================================================
   🛡️ ADMINISTRACIÓN (SOLO ADMIN)
===================================================== */

/**
 * Cambiar contraseña de cualquier usuario
 */
router.put(
    "/password/:id",
    auth,
    admin,
    usuarioController.cambiarPassword
);

/**
 * Obtener todos los usuarios
 */
router.get(
    "/",
    auth,
    admin,
    usuarioController.obtenerUsuarios
);

/**
 * Obtener un usuario por ID
 */
router.get(
    "/:id",
    auth,
    admin,
    usuarioController.obtenerUsuario
);

/**
 * Crear usuario
 */
router.post(
    "/",
    auth,
    admin,
    usuarioController.crearUsuario
);

/**
 * Actualizar usuario por ID
 */
router.put(
    "/:id",
    auth,
    admin,
    usuarioController.actualizarUsuario
);

/**
 * Eliminar usuario por ID
 */
router.delete(
    "/:id",
    auth,
    admin,
    usuarioController.eliminarUsuario
);

module.exports = router;