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
    tokenVerificacion: { type: String, default: null },
    tokenExpira: { type: Date, default: null },

    /* ===============================
        🔐 RECUPERAR CONTRASEÑA
    =============================== */
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    resetPasswordCode: { type: String, default: null },
    resetPasswordCodeExpires: { type: Date, default: null },

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
        💳 SUSCRIPCIÓN (LISTO PARA MERCADO PAGO)
    =============================== */
    suscripcion: {
        activa: {
            type: Boolean,
            default: false,
        },
        tipo: {
            type: String,
            enum: ["semanal", "mensual", "ninguna"],
            default: "ninguna",
        },
        fechaInicio: { type: Date, default: null },
        fechaFin: { type: Date, default: null },
        // Guardamos el ID de pago o suscripción
        mercadoPagoId: { type: String, default: null },
        // Estatus: authorized, pending, cancelled, etc.
        mpStatus: { type: String, default: null }
    },

    /* ===============================
        📊 PROGRESO DEL USUARIO
    =============================== */
    leccionesValidadas: { type: [String], default: [] },
    cursosCompletados: { type: [String], default: [] },

}, { timestamps: true });

// Evitar redefinir el modelo si ya existe
module.exports = mongoose.models.Usuario || mongoose.model("Usuario", UsuarioSchema);