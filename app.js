const express = require("express");
const cors = require("cors");
require("dotenv").config();

// 🔹 Importación de Rutas
const authRoutes = require("./routes/authRoutes");
const progresoRoutes = require("./routes/progresoRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");
const examenRoutes = require("./routes/examenRoutes");
const constanciaRoutes = require("./routes/constanciaRoutes");
const pagoRoutes = require("./routes/pagoRoutes");
// Si tienes rutas de cursos, asegúrate de importarlas también:
const cursoRoutes = require("./routes/cursoRoutes");

const app = express();

/* =====================================================
    🔹 CORS CONFIGURACIÓN SEGURA PARA VERCEL + RAILWAY
===================================================== */
const allowedOrigins = [
    "http://localhost:5173",
    "https://yesems-frontend.vercel.app",
    "https://yesems-frontend-git-main-dmin9012-uxs-projects.vercel.app",
];

// Función para permitir previews dinámicos de Vercel
const isVercelPreview = function(origin) {
    return origin && origin.indexOf("vercel.app") !== -1;
};

app.use(
    cors({
        origin: function(origin, callback) {
            // Permitir Postman, server-to-server y el Webhook de Mercado Pago
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.indexOf(origin) !== -1 || isVercelPreview(origin)) {
                return callback(null, true);
            }

            return callback(new Error("CORS bloqueado por política de seguridad"));
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// 🔹 Preflight explícito para todas las rutas
app.options("*", cors());

// 🔹 Middleware para JSON (Aumenta el límite si manejas imágenes/PDFs pesados)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/* =====================================================
    🔹 REGISTRO DE RUTAS API
===================================================== */
app.use("/api/auth", authRoutes);
app.use("/api/usuario", usuarioRoutes);
app.use("/api/curso", cursoRoutes); // 👈 Agregada para completar el esquema
app.use("/api/progreso", progresoRoutes);
app.use("/api/examen", examenRoutes);
app.use("/api/constancia", constanciaRoutes);
app.use("/api/pago", pagoRoutes);

/* =====================================================
    🔹 HEALTH CHECK (Para Railway/Vercel)
===================================================== */
app.get("/", function(req, res) {
    res.status(200).json({
        ok: true,
        message: "Backend YESems funcionando correctamente",
        version: "1.0.0"
    });
});

/* =====================================================
    🔹 MANEJO GLOBAL DE ERRORES
===================================================== */
app.use(function(err, req, res, next) {
    const errorMessage = err.message || "Error interno del servidor";
    console.error("❌ Error global:", errorMessage);

    res.status(err.status || 500).json({
        ok: false,
        message: errorMessage,
    });
});

module.exports = app;