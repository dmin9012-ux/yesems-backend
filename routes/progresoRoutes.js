// routes/progresoRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const {
    validarLeccion,
    obtenerProgresoCurso,
    obtenerMisProgresos
} = require("../controllers/progresoController");

/* =========================================
   🔥 VALIDAR LECCIÓN (GUARDAR PROGRESO)
   POST /api/progreso/validar-leccion
========================================= */
router.post("/validar-leccion", auth, validarLeccion);

/* =========================================
   📌 OBTENER TODOS MIS PROGRESOS
   GET /api/progreso/mis-progresos
========================================= */
// Cambiamos "/" por "/mis-progresos" para coincidir con el frontend
router.get("/mis-progresos", auth, obtenerMisProgresos);

/* =========================================
   📌 OBTENER PROGRESO DE UN CURSO ESPECÍFICO
   GET /api/progreso/curso/:cursoId
========================================= */
// Añadimos "/curso/" para evitar colisiones con otras rutas
router.get("/curso/:cursoId", auth, obtenerProgresoCurso);

module.exports = router;