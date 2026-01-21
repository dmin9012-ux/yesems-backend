const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Rutas (asegúrate de que los archivos se llamen exactamente así)
const authRoutes = require("./routes/authRoutes");
const progresoRoutes = require("./routes/progresoRoutes");
const usuarioRoutes = require("./routes/UsuarioRoutes"); // todo minúscula
const examenRoutes = require("./routes/examenRoutes");
const constanciaRoutes = require("./routes/constanciaRoutes");

const app = express();

// Middleware
app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    })
);

app.use(express.json());


console.log("authRoutes:", authRoutes);
console.log("progresoRoutes:", progresoRoutes);
console.log("usuarioRoutes:", usuarioRoutes);
console.log("examenRoutes:", examenRoutes);
console.log("constanciaRoutes:", constanciaRoutes);


// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/progreso", progresoRoutes);
app.use("/api/usuario", usuarioRoutes);
app.use("/api/examen", examenRoutes);
app.use("/api/constancia", constanciaRoutes);

// Health check
app.get("/", (req, res) => {
    res.send("✅ Backend funcionando");
});

// Error global
app.use((err, req, res, next) => {
    console.error("❌ Error global:", err);
    res.status(500).json({
        ok: false,
        message: "Error interno del servidor",
    });
});

module.exports = app;