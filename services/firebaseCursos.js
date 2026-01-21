const { db } = require("./firebase");
const crypto = require("crypto");

/* =========================================
   🔥 OBTENER TODAS LAS LECCIONES DE UN CURSO
========================================= */
async function obtenerLeccionesCurso(cursoId) {
    try {
        if (!cursoId) return [];

        const snap = await db.collection("cursos").doc(cursoId).get();
        if (!snap.exists) return [];

        const data = snap.data();
        if (!data || !Array.isArray(data.niveles)) return [];

        const lecciones = [];
        for (let i = 0; i < data.niveles.length; i++) {
            const nivel = data.niveles[i];
            if (!Array.isArray(nivel.lecciones)) continue;
            for (let j = 0; j < nivel.lecciones.length; j++) {
                const leccion = nivel.lecciones[j];
                if (leccion && typeof leccion.id === "string") {
                    lecciones.push(leccion.id);
                }
            }
        }

        return lecciones;
    } catch (error) {
        console.error("❌ Firebase obtenerLeccionesCurso:", error);
        return [];
    }
}

/* =========================================
   🧩 OBTENER LECCIONES DE UN NIVEL
========================================= */
async function obtenerLeccionesNivel(cursoId, nivelNumero) {
    try {
        if (!cursoId || typeof nivelNumero !== "number") return [];

        const snap = await db.collection("cursos").doc(cursoId).get();
        if (!snap.exists) return [];

        const data = snap.data();
        if (!Array.isArray(data.niveles)) return [];

        let nivel = null;
        for (let i = 0; i < data.niveles.length; i++) {
            const n = data.niveles[i];
            const numeroNivel = (n.numero !== undefined && n.numero !== null) ? n.numero : (i + 1);
            if (Number(numeroNivel) === Number(nivelNumero)) {
                nivel = n;
                break;
            }
        }

        if (!nivel || !Array.isArray(nivel.lecciones)) return [];

        const lecciones = [];
        for (let i = 0; i < nivel.lecciones.length; i++) {
            const l = nivel.lecciones[i];
            if (l && typeof l.id === "string") lecciones.push(l.id);
        }

        return lecciones;
    } catch (error) {
        console.error("❌ Firebase obtenerLeccionesNivel:", error);
        return [];
    }
}

/* =========================================
   🔍 OBTENER NIVEL DE UNA LECCIÓN
========================================= */
async function obtenerNivelDeLeccion(cursoId, leccionId) {
    try {
        if (!cursoId || !leccionId) return null;

        const snap = await db.collection("cursos").doc(cursoId).get();
        if (!snap.exists) return null;

        const data = snap.data();
        if (!Array.isArray(data.niveles)) return null;

        for (let i = 0; i < data.niveles.length; i++) {
            const nivel = data.niveles[i];
            if (!Array.isArray(nivel.lecciones)) continue;
            for (let j = 0; j < nivel.lecciones.length; j++) {
                if (nivel.lecciones[j].id === leccionId) {
                    const numeroNivel = (nivel.numero !== undefined && nivel.numero !== null) ? nivel.numero : (i + 1);
                    return Number(numeroNivel);
                }
            }
        }

        return null;
    } catch (error) {
        console.error("❌ Firebase obtenerNivelDeLeccion:", error);
        return null;
    }
}

/* =========================================
   🧠 OBTENER PREGUNTAS DE UN NIVEL
   🔹 Garantiza devolver preguntas válidas
========================================= */
async function obtenerPreguntasNivel(cursoId, nivelNumero, cantidad) {
    try {
        cantidad = cantidad || 10;
        if (!cursoId || typeof nivelNumero !== "number") return [];

        const snapCurso = await db.collection("cursos").doc(cursoId).get();
        if (!snapCurso.exists) {
            console.log("❌ Curso " + cursoId + " no existe");
            return [];
        }

        const data = snapCurso.data();
        if (!Array.isArray(data.niveles)) return [];

        let nivelDoc = null;
        for (let i = 0; i < data.niveles.length; i++) {
            const n = data.niveles[i];
            const numeroNivel = (n.numero !== undefined && n.numero !== null) ? n.numero : (i + 1);
            if (Number(numeroNivel) === Number(nivelNumero)) {
                nivelDoc = n;
                break;
            }
        }

        if (!nivelDoc) {
            console.log("❌ Nivel " + nivelNumero + " no encontrado en curso " + cursoId);
            return [];
        }

        const preguntas = [];
        if (Array.isArray(nivelDoc.preguntas)) {
            for (let i = 0; i < nivelDoc.preguntas.length; i++) {
                const p = nivelDoc.preguntas[i];
                if (!p || typeof p.pregunta !== "string" || !Array.isArray(p.opciones)) {
                    console.log("⚠️ Pregunta inválida nivel " + nivelNumero + ", índice " + i, p);
                    continue;
                }
                preguntas.push({
                    id: p.id || crypto.createHash("md5").update(p.pregunta + i).digest("hex"),
                    pregunta: p.pregunta,
                    opciones: p.opciones,
                    correcta: (p.correcta !== undefined && p.correcta !== null) ? p.correcta : 0
                });
            }
        }

        if (preguntas.length === 0) {
            console.log("⚠️ Nivel " + nivelNumero + " no tiene preguntas válidas en curso " + cursoId);
            return [];
        }

        // Mezclar y limitar
        preguntas.sort(function() { return Math.random() - 0.5; });
        if (preguntas.length > cantidad) preguntas.splice(cantidad);

        return preguntas;
    } catch (error) {
        console.error("❌ Error obtenerPreguntasNivel:", error);
        return [];
    }
}

/* =========================================
   🔢 TOTAL DE NIVELES DEL CURSO
========================================= */
async function obtenerTotalNivelesCurso(cursoId) {
    try {
        if (!cursoId) return 0;

        const snap = await db.collection("cursos").doc(cursoId).get();
        if (!snap.exists) return 0;

        const data = snap.data();
        if (!Array.isArray(data.niveles)) return 0;

        return data.niveles.length;
    } catch (error) {
        console.error("❌ Firebase obtenerTotalNivelesCurso:", error);
        return 0;
    }
}

/* =========================================
   📘 OBTENER CURSO POR ID
========================================= */
async function obtenerCursoPorId(cursoId) {
    try {
        if (!cursoId) return null;

        const snap = await db.collection("cursos").doc(cursoId).get();
        if (!snap.exists) return null;

        return snap.data();
    } catch (error) {
        console.error("❌ Firebase obtenerCursoPorId:", error);
        return null;
    }
}

module.exports = {
    obtenerLeccionesCurso,
    obtenerLeccionesNivel,
    obtenerNivelDeLeccion,
    obtenerPreguntasNivel,
    obtenerTotalNivelesCurso,
    obtenerCursoPorId,
};