const mongoose = require("mongoose");

const ExamenIntentoSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario",
        required: true,
    },

    cursoId: {
        type: String,
        required: true,
    },

    nivelNumero: {
        type: Number,
        required: true,
    },

    puntaje: {
        type: Number, // 0 - 100
        required: true,
    },

    correctas: {
        type: Number,
        required: true,
    },

    totalPreguntas: {
        type: Number,
        required: true,
    },

    aprobado: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

module.exports = mongoose.model("ExamenIntento", ExamenIntentoSchema);