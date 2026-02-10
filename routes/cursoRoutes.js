const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const suscripcionActiva = require("../middleware/suscripcion");

// Nota: Verifica si tu carpeta es 'Controllers' o 'controllers'
const {
    getCursos,
    getCursoById,
    crearCurso
} = require("../controllers/cursoController");

/* ===============================
    📚 RUTAS DE CURSOS
   =============================== */

/* 🔓 LISTADO DE CURSOS */
router.get(
    "/",
    auth,
    suscripcionActiva,
    getCursos
);

/* 🔓 DETALLE DE CURSO */
router.get(
    "/:id",
    auth,
    suscripcionActiva,
    getCursoById
);

/* 🔐 CREAR CURSO (Solo Administradores) */
router.post(
    "/",
    auth,
    admin,
    crearCurso
);

module.exports = router;