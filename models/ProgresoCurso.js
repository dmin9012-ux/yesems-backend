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
       → IDs reales de Firebase
    ===================================== */
    leccionesCompletadas: {
        type: [String],
        default: [],
    },

    /* =====================================
       📂 NIVELES CON LECCIONES COMPLETAS
       → Permite saber si ya puede presentar examen
       Ej: [1,2]
    ===================================== */
    nivelesConLeccionesCompletas: {
        type: [Number],
        default: [],
    },

    /* =====================================
       ✅ NIVELES APROBADOS (EXAMEN)
       → Ejemplo: [1,2]
    ===================================== */
    nivelesAprobados: {
        type: [Number],
        default: [],
    },

    /* =====================================
       🔓 NIVELES DESBLOQUEADOS
       → El frontend debe guiarse por esto
       Ej: [1,2,3]
    ===================================== */
    nivelesDesbloqueados: {
        type: [Number],
        default: [1], // 🔥 Nivel 1 siempre disponible
    },

    /* =====================================
       📝 HISTORIAL DE EXÁMENES
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
        }, ],

        respuestas: [{
            preguntaId: {
                type: String,
                required: true,
            },
            respuesta: {
                type: Number,
                required: true,
            },
        }, ],

        aprobado: {
            type: Boolean,
            default: false,
        },

        porcentaje: {
            type: Number,
            default: 0,
        },

        fecha: {
            type: Date,
            default: Date.now,
        },
    }, ],

    /* =====================================
       🏁 CURSO FINALIZADO
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
   🔒 UN SOLO PROGRESO POR CURSO
===================================== */
ProgresoCursoSchema.index({ usuario: 1, cursoId: 1 }, { unique: true });

module.exports =
    mongoose.models.ProgresoCurso ||
    mongoose.model("ProgresoCurso", ProgresoCursoSchema);