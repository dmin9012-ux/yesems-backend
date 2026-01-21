const { db } = require("../config/firebase");

/**
 * 🔥 Obtener preguntas de examen por curso y nivel
 * Devuelve 10 preguntas ALEATORIAS
 */
const obtenerPreguntasNivel = async(cursoId, nivelId, cantidad = 10) => {
    try {
        const preguntasRef = db
            .collection("cursos")
            .doc(cursoId)
            .collection("niveles")
            .doc(nivelId)
            .collection("preguntas");

        const snapshot = await preguntasRef.get();

        if (snapshot.empty) return [];

        const preguntas = [];

        snapshot.forEach(doc => {
            preguntas.push({
                id: doc.id,
                ...doc.data(),
            });
        });

        // 🔀 Mezclar aleatoriamente
        const mezcladas = preguntas.sort(() => 0.5 - Math.random());

        // 🎯 Limitar cantidad
        return mezcladas.slice(0, cantidad);
    } catch (error) {
        console.error("❌ Error obtenerPreguntasNivel:", error);
        throw new Error("Error al obtener preguntas del nivel");
    }
};

module.exports = {
    obtenerPreguntasNivel,
};