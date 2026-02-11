const { MercadoPagoConfig, Payment } = require('mercadopago');
const Usuario = require("../models/Usuario");
const mercadoPagoService = require("../services/mercadoPagoService");

// Configuración del cliente con el Access Token de tus variables de entorno
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN
});

/* =========================================
    💳 CREAR PREFERENCIA DE PAGO
    POST /api/pago/crear-preferencia
========================================= */
exports.crearPagoSuscripcion = async(req, res) => {
    try {
        const usuarioId = req.usuario.id; // Obtenido del middleware 'auth'
        const usuario = await Usuario.findById(usuarioId);

        if (!usuario) {
            return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
        }

        // Llamamos al servicio para generar el link de Mercado Pago
        // Pasamos el email y el ID (este último para el external_reference)
        const response = await mercadoPagoService.crearPlanSuscripcion(usuario.email, usuario._id);

        res.status(200).json({
            ok: true,
            init_point: response.init_point, // URL a la que redirigiremos al usuario
        });

    } catch (error) {
        console.error("❌ Error al crear suscripción:", error.message);
        res.status(500).json({ ok: false, message: "Error al generar el link de pago" });
    }
};

/* =========================================
    🔔 WEBHOOK (Notificación de Mercado Pago)
    POST /api/pago/webhook
========================================= */
exports.webhookMercadoPago = async(req, res) => {
    const query = req.query;
    const body = req.body;

    // Mercado Pago envía el tipo de evento en 'topic' o 'type'
    const topic = query.topic || query.type;

    try {
        if (topic === "payment") {
            // Obtenemos el ID del pago
            const paymentId = query.id || (body.data && body.data.id);

            if (!paymentId) {
                return res.status(200).send("OK");
            }

            // Consultamos los detalles del pago a Mercado Pago
            const payment = new Payment(client);
            const data = await payment.get({ id: paymentId });

            // Si el pago fue aprobado, activamos la suscripción
            if (data.status === "approved") {
                const usuarioId = data.external_reference; // Recuperamos el ID que enviamos al inicio

                const fechaInicio = new Date();
                const fechaFin = new Date();

                /** * ==========================================
                 * ⏱️ CONFIGURACIÓN DE DURACIÓN (MODO PRUEBA)
                 * ==========================================
                 */
                // DESCOMENTA esta línea para producción (7 días):
                // fechaFin.setDate(fechaFin.getDate() + 7); 

                // COMENTA esta línea después de tus pruebas (5 minutos):
                fechaFin.setMinutes(fechaFin.getMinutes() + 5);

                const usuario = await Usuario.findById(usuarioId);

                if (usuario) {
                    usuario.suscripcion = {
                        estado: "active", // Estado para que el Front lo reconozca
                        tipo: "semanal",
                        fechaInicio: fechaInicio,
                        fechaFin: fechaFin, // Fecha de corte
                        mercadoPagoId: paymentId.toString(),
                        mpStatus: data.status
                    };

                    await usuario.save();
                    console.log(`✅ Suscripción activada (5 min) para: ${usuario.email}`);
                }
            }
        }

        // Mercado Pago necesita recibir un 200 OK para dejar de enviar la notificación
        res.status(200).send("OK");

    } catch (error) {
        console.error("❌ Error en Webhook:", error.message);
        // Respondemos con error para que MP reintente después si fue un fallo temporal
        res.status(500).send("Error interno");
    }
};