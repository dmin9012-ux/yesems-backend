const express = require("express");
const router = express.Router();

// Importamos el middleware de autenticación y el controlador
const auth = require("../middleware/auth");
const pagoController = require("../controllers/pagoController");

/* =========================================
    💳 CREAR PAGO DE SUSCRIPCIÓN
    POST /api/pago/crear
    - Requiere: Usuario logueado (JWT)
    - Cambiado de "/crear" a "/crear-preferencia" para que coincida con el Front
========================================= */
router.post("/crear-preferencia", auth, pagoController.crearPagoSuscripcion);

/* =========================================
    🔔 WEBHOOK MERCADO PAGO
    POST /api/pago/webhook
    - Requiere: Acceso público (comunicación server-to-server)
    - Acción: Recibe notificaciones y activa suscripciones
========================================= */
router.post("/webhook", pagoController.webhookMercadoPago);

module.exports = router;