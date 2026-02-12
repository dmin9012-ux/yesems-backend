const mongoose = require("mongoose");

const UsuarioSchema = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },

    /* ===============================
        📧 VERIFICACIÓN Y RECUPERACIÓN
    =============================== */
    verificado: { type: Boolean, default: false },
    tokenVerificacion: { type: String, default: null },
    tokenExpira: { type: Date, default: null },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    resetPasswordCode: { type: String, default: null },
    resetPasswordCodeExpires: { type: Date, default: null },

    /* ===============================
        👤 ROLES / ESTADO
    =============================== */
    rol: { type: String, enum: ["admin", "usuario"], default: "usuario" },
    estado: { type: String, enum: ["activo", "suspendido"], default: "activo" },

    /* =========================================
        💳 SUSCRIPCIÓN (UNIFICADO CON EL FRONT)
    ========================================= */
    suscripcion: {
        estado: {
            type: String,
            enum: ["active", "inactive", "expired"],
            default: "inactive"
        },
        tipo: {
            type: String,
            // ✅ CORRECCIÓN: Agregamos "prueba_hora" a la lista de permitidos
            enum: ["semanal", "mensual", "prueba_corta", "prueba_hora", "ninguna"],
            default: "ninguna"
        },
        fechaInicio: { type: Date, default: null },
        fechaFin: { type: Date, default: null },
        mercadoPagoId: { type: String, default: null },
        mpStatus: { type: String, default: null }
    },

    /* ===============================
        📊 PROGRESO DEL USUARIO
    ============================== */
    leccionesValidadas: { type: [String], default: [] },
    cursosCompletados: { type: [String], default: [] },

}, { timestamps: true });

module.exports = mongoose.models.Usuario || mongoose.model("Usuario", UsuarioSchema);