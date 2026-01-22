// app.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

// 🔹 Rutas
const authRoutes = require("./routes/authRoutes");
const progresoRoutes = require("./routes/progresoRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");
const examenRoutes = require("./routes/examenRoutes");
const constanciaRoutes = require("./routes/constanciaRoutes");

const app = express();

/* =====================================================
   🔹 CORS CONFIGURACIÓN SEGURA PARA VERCEL + RAILWAY
===================================================== */
const allowedOrigins = [
    "http://localhost:5173",
    "https://yesems-frontend.vercel.app",
    "https://yesems-frontend-git-main-dmin9012-uxs-projects.vercel.app",
];

// Permitir previews dinámicos de Vercel
const isVercelPreview = (origin) =>
    origin && origin.includes("vercel.app");

app.use(
    cors({
        origin: (origin, callback) => {
            // Permitir Postman, server-to-server o same-origin
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin) || isVercelPreview(origin)) {
                return callback(null, true);
            }

            return callback(new Error(`CORS bloqueado: ${origin}`));
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// 🔹 Preflight explícito
app.options("*", cors());

// 🔹 Middleware para JSON
app.use(express.json());

/* =====================================================
   🔹 RUTAS API
===================================================== */
app.use("/api/auth", authRoutes);
app.use("/api/usuario", usuarioRoutes);
app.use("/api/progreso", progresoRoutes);
app.use("/api/examen", examenRoutes);
app.use("/api/constancia", constanciaRoutes);

/* =====================================================
   🔹 HEALTH CHECK
===================================================== */
app.get("/", (req, res) => {
    res.status(200).json({
        ok: true,
        message: "✅ Backend YESems funcionando correctamente",
    });
});

/* =====================================================
   🔹 MANEJO GLOBAL DE ERRORES
===================================================== */
app.use((err, req, res, next) => {
    console.error("❌ Error global:", err.message);

    res.status(err.statusCode || 500).json({
        ok: false,
        message: err.message || "Error interno del servidor",
    });
});

module.exports = app;