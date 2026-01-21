const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const examenController = require("../controllers/examenController");

/*
=====================================================
 🔹 VERIFICAR SI EL USUARIO PUEDE ACCEDER A UN NIVEL
 GET /api/examen/:cursoId/nivel/:nivel/puede-acceder
=====================================================
*/
router.get(
    "/:cursoId/nivel/:nivel/puede-acceder",
    auth,
    examenController.puedeAccederNivel
);

/*
=====================================================
 🔹 OBTENER EXAMEN DE UN NIVEL
 GET /api/examen/:cursoId/nivel/:nivel
=====================================================
*/
router.get(
    "/:cursoId/nivel/:nivel",
    auth,
    examenController.obtenerExamenNivel
);

/*
=====================================================
 🔹 ENVIAR / VALIDAR EXAMEN DE UN NIVEL
 POST /api/examen/:cursoId/nivel/:nivel
=====================================================
*/
router.post(
    "/:cursoId/nivel/:nivel",
    auth,
    examenController.enviarExamenNivel
);

module.exports = router;