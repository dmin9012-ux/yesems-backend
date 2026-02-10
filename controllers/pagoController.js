const { MercadoPagoConfig, Payment } = require('mercadopago');
const Usuario = require("../models/Usuario"); // Asegúrate de que la 'u' sea minúscula si así está el archivo
const mercadoPagoService = require("../services/mercadoPagoService");

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN
});

/* =========================================
    💳 CREAR SUSCRIPCIÓN (Link de Cobro)
    POST /api/pago/crear
========================================= */
exports.crearPagoSuscripcion = async(req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const usuario = await Usuario.findById(usuarioId);

        if (!usuario) {
            return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
        }

        // Llamamos al service que creamos en el paso anterior
        const response = await mercadoPagoService.crearPlanSuscripcion(usuario.email, usuario._id);

        res.status(200).json({
            ok: true,
            init_point: response.init_point, // URL de Mercado Pago
        });

    } catch (error) {
        console.error("❌ Error al crear suscripción:", error.message);
        res.status(500).json({ ok: false, message: "Error al generar el link de pago" });
    }
};

/* =========================================
    🔔 WEBHOOK (Notificación Automática)
    POST /api/pago/webhook
========================================= */
exports.webhookMercadoPago = async(req, res) => {
    const query = req.query;
    const body = req.body;

    const topic = query.topic || query.type;

    try {
        // Manejamos la notificación de pago aprobado
        if (topic === "payment") {
            const paymentId = query.id || (body.data && body.data.id);

            if (!paymentId) {
                return res.status(200).send("OK");
            }

            const payment = new Payment(client);
            const data = await payment.get({ id: paymentId });

            if (data.status === "approved") {
                // El external_reference contiene el ID del usuario (definido en el Service)
                const usuarioId = data.external_reference;

                const fechaInicio = new Date();
                const fechaFin = new Date();
                fechaFin.setDate(fechaFin.getDate() + 7); // Duración de 1 semana

                const usuario = await Usuario.findById(usuarioId);

                if (usuario) {
                    usuario.suscripcion = {
                        activa: true,
                        tipo: "semanal",
                        fechaInicio: fechaInicio,
                        fechaFin: fechaFin,
                        mercadoPagoId: paymentId,
                        mpStatus: "authorized"
                    };

                    await usuario.save();
                    console.log("✅ Suscripción activada exitosamente para:", usuario.email);
                }
            }
        }

        // Siempre responder 200 a Mercado Pago
        res.status(200).send("OK");

    } catch (error) {
        console.error("❌ Error en Webhook:", error.message);
        res.status(500).send("Error");
    }
};