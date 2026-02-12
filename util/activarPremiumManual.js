const mongoose = require("mongoose");
const Usuario = require("../models/Usuario"); // 👈 ASEGÚRATE DE QUE LA RUTA SEA CORRECTA
require("dotenv").config();

const activarUsuarioManual = async(email, horas = 1) => {
    try {
        // 1. Conexión a la base de datos
        // Usará la variable MONGODB_URI de tu archivo .env
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log("📡 Conectado a MongoDB...");
        }

        const fechaInicio = new Date();
        const fechaFin = new Date();
        fechaFin.setHours(fechaFin.getHours() + horas);

        // 2. Actualización
        const usuarioActualizado = await Usuario.findOneAndUpdate({ email: email }, {
            $set: {
                "suscripcion.estado": "active",
                "suscripcion.tipo": "prueba_hora",
                "suscripcion.fechaInicio": fechaInicio,
                "suscripcion.fechaFin": fechaFin,
                "suscripcion.mercadoPagoId": "ACTIVACION_MANUAL_ADMIN",
                "suscripcion.mpStatus": "approved"
            }
        }, { new: true, runValidators: true });

        if (!usuarioActualizado) {
            console.log(`❌ No se encontró el usuario: ${email}`);
            return;
        }

        console.log("========================================");
        console.log(`✅ USUARIO ACTIVADO CORRECTAMENTE`);
        console.log(`👤 Nombre: ${usuarioActualizado.nombre}`);
        console.log(`⏳ Expira el: ${fechaFin.toLocaleString()}`);
        console.log("========================================");

    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        await mongoose.connection.close();
        console.log("🔌 Conexión cerrada.");
        process.exit();
    }
};

// 🚀 ESTO ES LO QUE HACE QUE CORRA:
// Cambia el correo por el del usuario que quieras regalarle la suscripción
activarUsuarioManual("fortisfernando7@gmail.com", 1);