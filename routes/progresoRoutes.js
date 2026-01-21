const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const {
    validarLeccion,
    obtenerProgresoCurso,
    obtenerMisProgresos
} = require("../controllers/progresoController");

/*
=========================================
 🔥 VALIDAR LECCIÓN (GUARDAR PROGRESO)
 POST /api/progreso/validar-leccion
=========================================
*/
router.post("/validar-leccion", auth, validarLeccion);

/*
=========================================
 📌 OBTENER TODOS MIS PROGRESOS
 GET /api/progreso
=========================================
*/
router.get("/", auth, obtenerMisProgresos);

/*
=========================================
 📌 OBTENER PROGRESO DE UN CURSO
 GET /api/progreso/:cursoId
=========================================
*/
router.get("/:cursoId", auth, obtenerProgresoCurso);

module.exports = router;