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
    },

    tokenExpira: {
        type: Date,
    },

    /* ===============================
       🔐 RECUPERAR CONTRASEÑA
    =============================== */
    // Token antiguo (opcional, lo dejamos por compatibilidad)
    resetPasswordToken: {
        type: String,
    },

    // Expiración del token antiguo
    resetPasswordExpires: {
        type: Date,
    },

    // ✅ Nuevo flujo con código de 6 dígitos
    resetPasswordCode: {
        type: String,
    },

    resetPasswordCodeExpires: {
        type: Date,
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
       📊 PROGRESO
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

module.exports =
    mongoose.models.Usuario || mongoose.model("Usuario", UsuarioSchema);