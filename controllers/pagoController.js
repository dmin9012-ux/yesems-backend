const { MercadoPagoConfig, Payment } = require('mercadopago');
const Usuario = require("../models/Usuario");
const mercadoPagoService = require("../services/mercadoPagoService");

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN
});

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

exports.webhookMercadoPago = async(req, res) => {
    // 🔍 LOG 1: Ver si Mercado Pago entró al Webhook
    console.log("🔔 Webhook recibido. Query:", req.query, "Body:", req.body);

    const query = req.query;
    const body = req.body;
    const topic = query.topic || query.type || (body && body.type);

    try {
        if (topic === "payment") {
            const paymentId = query.id || (body.data && body.data.id) || body.id;
            console.log("💳 Procesando pago ID:", paymentId);

            if (!paymentId) {
                console.warn("⚠️ No se encontró paymentId");
                return res.status(200).send("OK");
            }

            const payment = new Payment(client);
            const data = await payment.get({ id: paymentId });

            console.log("📊 Estado del pago en MP:", data.status);

            if (data.status === "approved") {
                const usuarioId = data.external_reference;
                console.log("👤 Intentando activar usuario ID:", usuarioId);

                const fechaInicio = new Date();
                const fechaFin = new Date();
                fechaFin.setHours(fechaFin.getHours() + 1); // 1 HORA

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
                    console.log(`✅ ÉXITO: Usuario ${usuario.email} ahora es PREMIUM por 1 hora.`);
                } else {
                    console.error("❌ ERROR: Usuario no encontrado en DB con ID:", usuarioId);
                }
            }
        }

        // Siempre responder 200 a Mercado Pago
        res.status(200).send("OK");

    } catch (error) {
        console.error("❌ Error crítico en Webhook:", error.message);
        res.status(500).send("Error interno");
    }
};