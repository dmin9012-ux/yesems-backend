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
        const usuarioId = req.usuario.id;
        const usuario = await Usuario.findById(usuarioId);

        if (!usuario) {
            return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
        }

        const response = await mercadoPagoService.crearPlanSuscripcion(usuario.email, usuario._id);

        res.status(200).json({
            ok: true,
            init_point: response.init_point,
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
    const topic = query.topic || query.type;

    try {
        if (topic === "payment") {
            const paymentId = query.id || (body.data && body.data.id);

            if (!paymentId) {
                return res.status(200).send("OK");
            }

            const payment = new Payment(client);
            const data = await payment.get({ id: paymentId });

            if (data.status === "approved") {
                const usuarioId = data.external_reference;

                const fechaInicio = new Date();
                const fechaFin = new Date();

                /** * ==========================================
                 * ⏱️ CONFIGURACIÓN DE DURACIÓN (MODO PRUEBA)
                 * ==========================================
                 */
                // Producción: fechaFin.setDate(fechaFin.getDate() + 7); 

                // 🛠️ MODO PRUEBA: 1 HORA (60 minutos)
                fechaFin.setHours(fechaFin.getHours() + 1);

                const usuario = await Usuario.findById(usuarioId);

                if (usuario) {
                    usuario.suscripcion = {
                        estado: "active",
                        tipo: "prueba_hora",
                        fechaInicio: fechaInicio,
                        fechaFin: fechaFin,
                        mercadoPagoId: paymentId.toString(),
                        mpStatus: data.status
                    };

                    await usuario.save();
                    console.log(`✅ MODO PRUEBA: Suscripción de 1 HORA activada para: ${usuario.email}`);
                }
            }
        }

        res.status(200).send("OK");

    } catch (error) {
        console.error("❌ Error en Webhook:", error.message);
        res.status(500).send("Error interno");
    }
};