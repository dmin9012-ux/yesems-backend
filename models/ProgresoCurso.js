const mongoose = require("mongoose");

const ProgresoCursoSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario",
        required: true,
        index: true,
    },

    cursoId: {
        type: String,
        required: true,
        index: true,
    },

    /* =====================================
       📘 LECCIONES COMPLETADAS
    ===================================== */
    leccionesCompletadas: {
        type: [String], // IDs reales Firebase
        default: [],
    },

    /* =====================================
       ✅ NIVELES APROBADOS
    ===================================== */
    nivelesAprobados: {
        type: [Number],
        default: [],
    },

    /* =====================================
       📝 INTENTOS DE EXAMEN
    ===================================== */
    intentosExamen: [{
        nivel: {
            type: Number,
            required: true,
        },
        preguntas: [{
            id: { type: String, required: true },
            pregunta: { type: String, required: true },
            opciones: { type: [String], required: true },
            correcta: { type: Number, required: true },
        }],
        respuestas: [{
            preguntaId: {
                type: String,
                required: true,
            },
            respuesta: {
                type: Number,
                required: true,
            },
        }],
        aprobado: {
            type: Boolean,
            required: true,
            default: false,
        },
        porcentaje: {
            type: Number,
            required: true,
            default: 0,
        },
        fecha: {
            type: Date,
            default: Date.now,
        },
    }],

    /* =====================================
       🏁 FINALIZACIÓN DEL CURSO
    ===================================== */
    completado: {
        type: Boolean,
        default: false,
        index: true,
    },

    fechaFinalizacion: {
        type: Date,
        default: null,
    },

    /* =====================================
       🎓 CONSTANCIA
    ===================================== */
    constanciaEmitida: {
        type: Boolean,
        default: false,
    },

    constanciaUrl: {
        type: String,
        default: null,
    },
}, {
    timestamps: true,
    versionKey: false,
});

/* =====================================
   🔒 EVITAR DUPLICADOS
===================================== */
ProgresoCursoSchema.index({ usuario: 1, cursoId: 1 }, { unique: true });

module.exports =
    mongoose.models.ProgresoCurso ||
    mongoose.model("ProgresoCurso", ProgresoCursoSchema);