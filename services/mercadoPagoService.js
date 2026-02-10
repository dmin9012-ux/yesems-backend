const { MercadoPagoConfig, PreApproval } = require('mercadopago');
require("dotenv").config();

// Configuramos el cliente con tu Access Token de producción
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN
});

/**
 * Crea una suscripción recurrente semanal
 */
const crearPlanSuscripcion = async(usuarioEmail, usuarioId) => {
    const preApproval = new PreApproval(client);

    try {
        const body = {
            reason: "Suscripción Semanal Yesems",
            payer_email: usuarioEmail,
            auto_recurring: {
                frequency: 7, // Cada 7 días
                frequency_type: "days",
                transaction_amount: 100, // Precio de la suscripción
                currency_id: "MXN"
            },
            // Usamos variable de entorno para la redirección
            back_url: `${process.env.FRONT_URL}/perfil`,
            status: "authorized",
            // El external_reference es clave para el Webhook
            external_reference: usuarioId.toString(),
        };

        const response = await preApproval.create({ body });

        // Retornamos la respuesta completa para obtener el 'init_point'
        return response;
    } catch (error) {
        console.error("❌ Error al crear suscripción en MP Service:", error.message);
        throw error;
    }
};

module.exports = { crearPlanSuscripcion };