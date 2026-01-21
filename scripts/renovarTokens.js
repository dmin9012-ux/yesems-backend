// scripts/renovarTokens.js
require("dotenv").config();
const mongoose = require("mongoose");
const crypto = require("crypto");
const Usuario = require("../models/Usuario"); // ajusta la ruta si es necesario

const conectarDB = async() => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Conectado a MongoDB");
    } catch (error) {
        console.error("❌ Error conectando a DB:", error);
        process.exit(1);
    }
};

const renovarTokens = async() => {
    try {
        const usuarios = await Usuario.find({ verificado: false });

        for (const usuario of usuarios) {
            const token = crypto.randomBytes(32).toString("hex");
            usuario.tokenVerificacion = token;
            usuario.tokenExpira = Date.now() + 1000 * 60 * 30; // 30 minutos
            await usuario.save();

            console.log(`Token actualizado para: ${usuario.email}`);
        }

        console.log("✅ Tokens renovados para todos los usuarios no verificados");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error renovando tokens:", error);
        process.exit(1);
    }
};

const main = async() => {
    await conectarDB();
    await renovarTokens();
};

main();