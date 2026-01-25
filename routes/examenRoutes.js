const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const examenController = require("../controllers/examenController");

/* =====================================================
   🔥 RUTAS DE EXAMEN
===================================================== */

/* =====================================================
   🔹 VERIFICAR SI EL USUARIO PUEDE ACCEDER A UN NIVEL
   (SOLO PARA UI / FRONTEND)
===================================================== */
router.get(
    "/:cursoId/nivel/:nivel/puede-acceder",
    auth,
    examenController.puedeAccederNivel
);

/* =====================================================
   📌 OBTENER EXAMEN DE UN NIVEL
   TODAS LAS VALIDACIONES ESTÁN EN EL CONTROLLER
===================================================== */
router.get(
    "/:cursoId/nivel/:nivel",
    auth,
    examenController.obtenerExamenNivel
);

/* =====================================================
   📝 ENVIAR EXAMEN DE UN NIVEL
===================================================== */
router.post(
    "/:cursoId/nivel/:nivel",
    auth,
    examenController.enviarExamenNivel
);

/* =====================================================
   ❌ BLOQUEAR MÉTODOS NO PERMITIDOS
===================================================== */
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

module.exports = router;