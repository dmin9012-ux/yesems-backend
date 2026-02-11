const { MercadoPagoConfig, Preference } = require('mercadopago');
require("dotenv").config();

// Configuramos el cliente con tu Access Token
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN
});

/**
 * Crea una preferencia de pago para acceso (Modo Prueba)
 * @param {string} usuarioEmail - Email del comprador
 * @param {string} usuarioId - ID del usuario en MongoDB
 */
const crearPlanSuscripcion = async(usuarioEmail, usuarioId) => {
    const preference = new Preference(client);

    try {
        const body = {
            items: [{
                id: "premium_prueba_1h",
                title: "Suscripción YESems (Modo Prueba)",
                quantity: 1,
                unit_price: 10, // 💵 Manteniendo $10 MXN para pruebas
                currency_id: "MXN",
                category_id: "learning",
                description: "Acceso total a la plataforma YESems por 1 hora"
            }],
            payer: {
                email: usuarioEmail
            },
            // El external_reference permite que el Webhook identifique al usuario
            external_reference: usuarioId.toString(),

            // 🔄 URLs de retorno: Redirigimos a la página donde pusimos la lógica de actualización
            back_urls: {
                success: `${process.env.FRONTEND_URL}/suscripcion`,
                failure: `${process.env.FRONTEND_URL}/suscripcion`,
                pending: `${process.env.FRONTEND_URL}/suscripcion`
            },

            // "approved" redirige automáticamente al usuario sin que tenga que dar clic en "Volver"
            auto_return: "approved",

            // URL del Webhook (debe ser tu URL de Railway)
            notification_url: `${process.env.BACKEND_URL}/api/pago/webhook`,

            // Solo permite pagos con aprobación inmediata
            binary_mode: true
        };

        const response = await preference.create({ body });

        return response;
    } catch (error) {
        console.error("❌ Error en mercadoPagoService (Preference):", error.message);
        throw error;
    }
};

module.exports = { crearPlanSuscripcion };