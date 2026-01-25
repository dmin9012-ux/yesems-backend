const mongoose = require("mongoose");

/* =====================================================
   🧠 SUBDOCUMENTOS
===================================================== */

const PreguntaExamenSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        trim: true,
    },
    pregunta: {
        type: String,
        required: true,
        trim: true,
    },
    opciones: {
        type: [String],
        required: true,
        validate: v => Array.isArray(v) && v.length >= 2,
    },
    correcta: {
        type: Number,
        required: true,
        min: 0,
    },
}, { _id: false });

const RespuestaExamenSchema = new mongoose.Schema({
    preguntaId: {
        type: String,
        required: true,
        trim: true,
    },
    respuesta: {
        type: Number,
        required: true,
        min: 0,
    },
}, { _id: false });

const IntentoExamenSchema = new mongoose.Schema({
    nivel: {
        type: Number,
        required: true,
        min: 1,
        index: true,
    },

    preguntas: {
        type: [PreguntaExamenSchema],
        required: true,
        validate: v => Array.isArray(v) && v.length > 0,
    },

    respuestas: {
        type: [RespuestaExamenSchema],
        default: [],
    },

    aprobado: {
        type: Boolean,
        default: false,
        index: true,
    },

    porcentaje: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },

    finalizado: {
        type: Boolean,
        default: false,
        index: true,
    },

    fecha: {
        type: Date,
        default: Date.now,
    },
}, { _id: false });

/* =====================================================
   📘 PROGRESO DEL CURSO
===================================================== */

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
        trim: true,
    },

    /* =====================================
       📘 LECCIONES COMPLETADAS
    ===================================== */
    leccionesCompletadas: {
        type: [String],
        default: [],
        index: true,
    },

    /* =====================================
       📂 NIVELES CON LECCIONES COMPLETAS
    ===================================== */
    nivelesConLeccionesCompletas: {
        type: [Number],
        default: [],
        index: true,
    },

    /* =====================================
       ✅ NIVELES APROBADOS
    ===================================== */
    nivelesAprobados: {
        type: [Number],
        default: [],
        index: true,
    },

    /* =====================================
       🔓 NIVELES DESBLOQUEADOS
    ===================================== */
    nivelesDesbloqueados: {
        type: [Number],
        default: [1],
        index: true,
    },

    /* =====================================
       📝 INTENTOS DE EXAMEN
    ===================================== */
    intentosExamen: {
        type: [IntentoExamenSchema],
        default: [],
    },

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

/* =====================================================
   🔒 UN SOLO PROGRESO POR USUARIO Y CURSO
===================================================== */
ProgresoCursoSchema.index({ usuario: 1, cursoId: 1 }, { unique: true });

module.exports =
    mongoose.models.ProgresoCurso ||
    mongoose.model("ProgresoCurso", ProgresoCursoSchema);