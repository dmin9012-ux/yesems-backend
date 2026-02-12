const mongoose = require("mongoose");
const Usuario = require("../models/Usuario");
const path = require("path");

// ✅ Buscamos el .env una carpeta arriba de 'util'
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const activarUsuarioManual = async(email, horas = 1) => {
    try {
        // ✅ Usamos MONGO_URI (tal cual está en tu .env)
        const uri = process.env.MONGO_URI;

        if (!uri) {
            throw new Error("No se encontró MONGO_URI en el archivo .env. Revisa el nombre de la variable.");
        }

        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(uri);
            console.log("📡 Conectado a MongoDB con éxito...");
        }

        const fechaInicio = new Date();
        const fechaFin = new Date();
        fechaFin.setHours(fechaFin.getHours() + horas);

        const usuarioActualizado = await Usuario.findOneAndUpdate({ email: email.toLowerCase().trim() }, {
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
            console.log(`❌ No se encontró el usuario con email: ${email}`);
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

// 🚀 Ejecutamos para Ferna
activarUsuarioManual("fortisfernando7@gmail.com", 1);