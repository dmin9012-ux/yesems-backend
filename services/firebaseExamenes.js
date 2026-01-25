const { db } = require("../config/firebase");

/**
 * 🔥 Obtener preguntas de examen por curso y nivel
 * - Devuelve preguntas ALEATORIAS
 * - Filtra preguntas inválidas
 */
const obtenerPreguntasNivel = async(cursoId, nivelNumero, cantidad = 10) => {
    try {
        if (!cursoId || typeof nivelNumero !== "number") {
            return [];
        }

        const preguntasRef = db
            .collection("cursos")
            .doc(cursoId)
            .collection("niveles")
            .doc(String(nivelNumero))
            .collection("preguntas");

        const snapshot = await preguntasRef.get();

        if (!snapshot || snapshot.empty) {
            return [];
        }

        const preguntas = [];

        snapshot.forEach(doc => {
            const data = doc.data();

            if (
                data &&
                typeof data.pregunta === "string" &&
                Array.isArray(data.opciones) &&
                typeof data.correcta === "number"
            ) {
                preguntas.push({
                    id: doc.id,
                    pregunta: data.pregunta,
                    opciones: data.opciones,
                    correcta: data.correcta,
                });
            }
        });

        if (preguntas.length === 0) {
            return [];
        }

        // 🔀 Mezclar aleatoriamente
        preguntas.sort(() => 0.5 - Math.random());

        // 🎯 Limitar cantidad
        return preguntas.slice(0, cantidad);
    } catch (error) {
        console.error("❌ Error obtenerPreguntasNivel:", error);
        throw new Error("Error al obtener preguntas del nivel");
    }
};

module.exports = {
    obtenerPreguntasNivel,
};