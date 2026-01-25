const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const examenController = require("../controllers/examenController");

/* =====================================================
   🔥 RUTAS DE EXAMEN
===================================================== */

/* =====================================================
   🔹 VERIFICAR SI EL USUARIO PUEDE ACCEDER A UN NIVEL
   GET /api/examen/:cursoId/nivel/:nivel/puede-acceder
   ⚠️ DEBE IR ANTES QUE /:cursoId/nivel/:nivel
===================================================== */
router.get(
    "/:cursoId/nivel/:nivel/puede-acceder",
    auth,
    examenController.puedeAccederNivel
);

/* =====================================================
   📌 OBTENER EXAMEN DE UN NIVEL
   GET /api/examen/:cursoId/nivel/:nivel
===================================================== */
router.get(
    "/:cursoId/nivel/:nivel",
    auth,
    examenController.obtenerExamenNivel
);

/* ❌ MÉTODO NO PERMITIDO (EVITA RE-ABRIR EXAMEN) */
router.put(
    "/:cursoId/nivel/:nivel",
    auth,
    (req, res) => {
        return res.status(405).json({
            ok: false,
            message: "Método no permitido",
        });
    }
);

/* =====================================================
   📝 ENVIAR / VALIDAR EXAMEN DE UN NIVEL
   POST /api/examen/:cursoId/nivel/:nivel
===================================================== */
router.post(
    "/:cursoId/nivel/:nivel",
    auth,
    examenController.enviarExamenNivel
);

module.exports = router;