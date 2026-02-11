const { MercadoPagoConfig, Preference } = require('mercadopago');
require("dotenv").config();

// Configuramos el cliente con tu Access Token
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN
});

/**
 * Crea una preferencia de pago para acceso semanal (Pago Único)
 * @param {string} usuarioEmail - Email del comprador
 * @param {string} usuarioId - ID del usuario en MongoDB (para external_reference)
 */
const crearPlanSuscripcion = async(usuarioEmail, usuarioId) => {
    const preference = new Preference(client);

    try {
        const body = {
            items: [{
                id: "premium_semanal_100",
                title: "Suscripción Semanal YESems",
                quantity: 1,
                unit_price: 10, // 💵 Actualizado a $100 MXN
                currency_id: "MXN",
                category_id: "learning",
                description: "Acceso total a la plataforma YESems por 7 días"
            }],
            payer: {
                email: usuarioEmail
            },
            // El external_reference es vital para que el Webhook sepa a quién activar
            external_reference: usuarioId.toString(),

            // URLs de retorno al Frontend
            back_urls: {
                success: `${process.env.FRONT_URL}/perfil`,
                failure: `${process.env.FRONT_URL}/perfil`,
                pending: `${process.env.FRONT_URL}/perfil`
            },
            auto_return: "approved", // Redirige automáticamente tras un pago exitoso

            // URL del Webhook (debe ser la URL de tu backend en Railway)
            notification_url: `${process.env.BACKEND_URL}/api/pago/webhook`,

            // Modo binario: solo permite pagos que se aprueban o rechazan al instante
            binary_mode: true
        };

        const response = await preference.create({ body });

        // Retornamos el objeto que contiene el 'init_point'
        return response;
    } catch (error) {
        console.error("❌ Error en mercadoPagoService (Preference):", error.message);
        throw error;
    }
};

module.exports = { crearPlanSuscripcion };