// server.js
require("dotenv").config();

/* =====================================================
   🔥 Inicializaciones CRÍTICAS
===================================================== */

// Firebase (si falla, lo vemos en logs)
try {
    require("./services/firebase");
    console.log("🔥 Firebase inicializado");
} catch (error) {
    console.error("❌ Error inicializando Firebase:", error.message);
}

// DB
const conectarDB = require("./config/db");

// App
const app = require("./app");

/* =====================================================
   🚀 SERVER
===================================================== */

const PORT = process.env.PORT || 5000;

const iniciarServidor = async() => {
    try {
        await conectarDB();
        console.log("🗄️ MongoDB conectado");

        app.listen(PORT, () => {
            console.log(`🚀 Servidor YESems corriendo en puerto ${PORT}`);
        });
    } catch (error) {
        console.error("❌ Error al iniciar servidor:", error.message);
        process.exit(1);
    }
};

iniciarServidor();

/* =====================================================
   🔥 MANEJO DE ERRORES DE PROCESO
===================================================== */

process.on("unhandledRejection", (err) => {
    console.error("❌ Unhandled Rejection:", err.message);
});

process.on("uncaughtException", (err) => {
    console.error("❌ Uncaught Exception:", err.message);
    process.exit(1);
});