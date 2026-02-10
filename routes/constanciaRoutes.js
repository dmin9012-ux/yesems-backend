const express = require("express");
const router = express.Router();

// Controladores
const { generarConstancia } = require("../controllers/constanciaController");

// Middlewares
const auth = require("../middleware/auth");
const suscripcionActiva = require("../middleware/suscripcion"); // 🔹 Agregado

/* =====================================================
    📜 GENERAR CONSTANCIA DE UN CURSO
    GET /api/constancia/:cursoId
    - Requiere: Login (auth)
    - Requiere: Pago vigente (suscripcionActiva)
===================================================== */
router.get(
    "/:cursoId",
    auth,
    suscripcionActiva, // 🔹 Ahora el certificado también requiere pago activo
    generarConstancia
);

module.exports = router;