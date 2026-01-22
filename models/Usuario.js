// models/Usuario.js
const mongoose = require("mongoose");

const UsuarioSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true,
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },

    password: {
        type: String,
        required: true,
    },

    /* ===============================
       📧 VERIFICACIÓN DE CORREO
    =============================== */
    verificado: {
        type: Boolean,
        default: false,
    },

    tokenVerificacion: {
        type: String,
        default: null,
    },

    tokenExpira: {
        type: Date,
        default: null,
    },

    /* ===============================
       🔐 RECUPERAR CONTRASEÑA
    =============================== */
    resetPasswordToken: {
        type: String,
        default: null,
    },

    resetPasswordExpires: {
        type: Date,
        default: null,
    },

    // Nuevo flujo: código de 6 dígitos
    resetPasswordCode: {
        type: String,
        default: null,
    },

    resetPasswordCodeExpires: {
        type: Date,
        default: null,
    },

    /* ===============================
       👤 ROLES / ESTADO
    =============================== */
    rol: {
        type: String,
        enum: ["admin", "usuario"],
        default: "usuario",
    },

    estado: {
        type: String,
        enum: ["activo", "suspendido"],
        default: "activo",
    },

    /* ===============================
       📊 PROGRESO DEL USUARIO
    =============================== */
    leccionesValidadas: {
        type: [String],
        default: [],
    },

    cursosCompletados: {
        type: [String],
        default: [],
    },

}, {
    timestamps: true,
});

// Evitar redefinir el modelo en entornos con hot reload (Next.js / Vercel)
module.exports = mongoose.models.Usuario || mongoose.model("Usuario", UsuarioSchema);