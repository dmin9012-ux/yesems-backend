// app.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

// 🔹 Rutas
const authRoutes = require("./routes/authRoutes");
const progresoRoutes = require("./routes/progresoRoutes");
const examenRoutes = require("./routes/examenRoutes");
const constanciaRoutes = require("./routes/constanciaRoutes");

const app = express();

// 🔹 Dominios permitidos
const allowedOrigins = [
    "http://localhost:5173", // desarrollo local
    "https://yesems-frontend.vercel.app",
    "https://yesems-frontend-git-main-dmin9012-uxs-projects.vercel.app",
    "https://yesems-frontend-8htryr9ro-dmin9012-uxs-projects.vercel.app"
];

// 🔹 Middleware CORS
app.use(
    cors({
        origin: function(origin, callback) {
                // Permitir Postman o backend a backend
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error("No permitido por CORS: " + origin));
                }
            }
            // credentials: true, // opcional, solo si usas cookies
    })
);

// 🔹 Middleware para JSON
app.use(express.json());

// 🔹 Rutas base
app.use("/api/auth", authRoutes);
app.use("/api/progreso", progresoRoutes);
app.use("/api/examen", examenRoutes);
app.use("/api/constancia", constanciaRoutes);

// 🔹 Health check
app.get("/", (req, res) => {
    res.send("✅ Backend funcionando");
});

// 🔹 Middleware de error global
app.use((err, req, res, next) => {
    console.error("❌ Error global:", err.message);
    res.status(err.statusCode || 500).json({
        ok: false,
        message: err.message || "Error interno del servidor",
    });
});

module.exports = app;