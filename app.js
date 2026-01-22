const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Rutas
const authRoutes = require("./routes/authRoutes");
const progresoRoutes = require("./routes/progresoRoutes");
const usuarioRoutes = require("./routes/UsuarioRoutes"); // todo minúscula
const examenRoutes = require("./routes/examenRoutes");
const constanciaRoutes = require("./routes/constanciaRoutes");

const app = express();

// 🔹 Dominios permitidos
const allowedOrigins = [
    "http://localhost:5173", // para desarrollo local
    "https://yesems-frontend.vercel.app",
    "https://yesems-frontend-git-main-dmin9012-uxs-projects.vercel.app",
    "https://yesems-frontend-8htryr9ro-dmin9012-uxs-projects.vercel.app"
];

// Middleware CORS
app.use(
    cors({
        origin: function(origin, callback) {
            // Si no hay origin (Postman o backend a backend), permitir
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("No permitido por CORS: " + origin));
            }
        },
        credentials: true,
    })
);

app.use(express.json());

// 🔹 Consola para debug de rutas
console.log("authRoutes:", authRoutes);
console.log("progresoRoutes:", progresoRoutes);
console.log("usuarioRoutes:", usuarioRoutes);
console.log("examenRoutes:", examenRoutes);
console.log("constanciaRoutes:", constanciaRoutes);

// 🔹 Rutas
app.use("/api/auth", authRoutes);
app.use("/api/progreso", progresoRoutes);
app.use("/api/usuario", usuarioRoutes);
app.use("/api/examen", examenRoutes);
app.use("/api/constancia", constanciaRoutes);

// 🔹 Health check
app.get("/", (req, res) => {
    res.send("✅ Backend funcionando");
});

// 🔹 Error global
app.use((err, req, res, next) => {
    console.error("❌ Error global:", err.message);
    res.status(500).json({
        ok: false,
        message: "Error interno del servidor",
    });
});

module.exports = app;