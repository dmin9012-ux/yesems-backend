const express = require("express");
const router = express.Router();

// Middlewares de seguridad
const auth = require("../middleware/auth");
const suscripcionActiva = require("../middleware/suscripcion");

// Controladores
const {
    validarLeccion,
    obtenerProgresoCurso,
    obtenerMisProgresos
} = require("../controllers/progresoController");

/* =========================================
    🔥 VALIDAR LECCIÓN (GUARDAR PROGRESO)
    POST /api/progreso/validar-leccion
    - Middleware 1: auth (¿Quién eres?)
    - Middleware 2: suscripcionActiva (¿Ya pagaste?)
========================================= */
router.post(
    "/validar-leccion",
    auth,
    suscripcionActiva,
    validarLeccion
);

/* =========================================
    📌 OBTENER TODOS MIS PROGRESOS
    GET /api/progreso/mis-progresos
    - Bloqueado si no hay pago vigente
========================================= */
router.get(
    "/mis-progresos",
    auth,
    suscripcionActiva,
    obtenerMisProgresos
);

/* =========================================
    📌 OBTENER PROGRESO DE UN CURSO ESPECÍFICO
    GET /api/progreso/curso/:cursoId
    - Bloqueado si no hay pago vigente
========================================= */
router.get(
    "/curso/:cursoId",
    auth,
    suscripcionActiva,
    obtenerProgresoCurso
);

module.exports = router;