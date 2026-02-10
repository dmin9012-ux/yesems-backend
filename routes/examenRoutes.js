const express = require("express");
const router = express.Router();

// Middlewares
const auth = require("../middleware/auth");
const suscripcionActiva = require("../middleware/suscripcion");

// Controlador
const examenController = require("../controllers/examenController");

// Log de control para depuración
console.log("🔥 ExamenRoutes cargado y blindado con suscripción");

/* =====================================================
    🔹 VERIFICAR SI EL USUARIO PUEDE ACCEDER A UN NIVEL
    GET /api/examen/:cursoId/nivel/:nivel/puede-acceder
    - Requiere: Token válido y Suscripción activa
===================================================== */
router.get(
    "/:cursoId/nivel/:nivel/puede-acceder",
    auth,
    suscripcionActiva,
    examenController.puedeAccederNivel
);

/* =====================================================
    📌 OBTENER EXAMEN DE UN NIVEL
    GET /api/examen/:cursoId/nivel/:nivel
    - Solo accesible si el pago está al día
===================================================== */
router.get(
    "/:cursoId/nivel/:nivel",
    auth,
    suscripcionActiva,
    examenController.obtenerExamenNivel
);

/* =====================================================
    🔹 ENVIAR / VALIDAR EXAMEN DE UN NIVEL
    POST /api/examen/:cursoId/nivel/:nivel
    - Solo accesible si el pago está al día
===================================================== */
router.post(
    "/:cursoId/nivel/:nivel",
    auth,
    suscripcionActiva,
    examenController.enviarExamenNivel
);

module.exports = router;