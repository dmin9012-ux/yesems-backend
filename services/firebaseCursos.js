const { db } = require("./firebase");
const crypto = require("crypto");

/* =====================================================
   🔥 OBTENER TODAS LAS LECCIONES DE UN CURSO (ID REAL)
===================================================== */
async function obtenerLeccionesCurso(cursoId) {
    try {
        if (!cursoId) return [];

        const snap = await db.collection("cursos").doc(cursoId).get();
        if (!snap.exists) return [];

        const data = snap.data();
        if (!data || !Array.isArray(data.niveles)) return [];

        const lecciones = [];
        data.niveles.forEach((nivel) => {
            if (!nivel || !Array.isArray(nivel.lecciones)) return;
            nivel.lecciones.forEach((leccion) => {
                if (leccion && typeof leccion.id === "string") {
                    lecciones.push(leccion.id);
                }
            });
        });

        return lecciones;
    } catch (error) {
        console.error("❌ Firebase obtenerLeccionesCurso:", error);
        return [];
    }
}

/* =====================================================
   🧩 OBTENER LECCIONES DE UN NIVEL (ID REAL)
===================================================== */
async function obtenerLeccionesNivel(cursoId, nivelNumero) {
    try {
        if (!cursoId || typeof nivelNumero !== "number") return [];

        const snap = await db.collection("cursos").doc(cursoId).get();
        if (!snap.exists) return [];

        const data = snap.data();
        if (!data || !Array.isArray(data.niveles)) return [];

        for (let i = 0; i < data.niveles.length; i++) {
            const nivel = data.niveles[i];
            if (!nivel) continue;

            const numeroNivel =
                nivel.numero !== undefined && nivel.numero !== null ?
                Number(nivel.numero) :
                i + 1;

            if (numeroNivel === nivelNumero) {
                if (!Array.isArray(nivel.lecciones)) return [];
                return nivel.lecciones
                    .filter((l) => l && typeof l.id === "string")
                    .map((l) => l.id);
            }
        }

        return [];
    } catch (error) {
        console.error("❌ Firebase obtenerLeccionesNivel:", error);
        return [];
    }
}

/* =====================================================
   🔍 OBTENER NIVEL DE UNA LECCIÓN (ID REAL)
===================================================== */
async function obtenerNivelDeLeccion(cursoId, leccionId) {
    try {
        if (!cursoId || !leccionId) return null;

        const snap = await db.collection("cursos").doc(cursoId).get();
        if (!snap.exists) return null;

        const data = snap.data();
        if (!data || !Array.isArray(data.niveles)) return null;

        for (let i = 0; i < data.niveles.length; i++) {
            const nivel = data.niveles[i];
            if (!nivel || !Array.isArray(nivel.lecciones)) continue;

            const numeroNivel =
                nivel.numero !== undefined && nivel.numero !== null ?
                Number(nivel.numero) :
                i + 1;

            if (nivel.lecciones.some((l) => l && l.id === leccionId)) {
                return numeroNivel;
            }
        }

        return null;
    } catch (error) {
        console.error("❌ Firebase obtenerNivelDeLeccion:", error);
        return null;
    }
}

/* =====================================================
   🧠 OBTENER PREGUNTAS DE UN NIVEL
===================================================== */
async function obtenerPreguntasNivel(cursoId, nivelNumero, cantidad = 10) {
    try {
        if (!cursoId || typeof nivelNumero !== "number") return [];

        const snap = await db.collection("cursos").doc(cursoId).get();
        if (!snap.exists) return [];

        const data = snap.data();
        if (!data || !Array.isArray(data.niveles)) return [];

        const nivelEncontrado = data.niveles.find((nivel, i) => {
            const numeroNivel =
                nivel.numero !== undefined && nivel.numero !== null ?
                Number(nivel.numero) :
                i + 1;
            return numeroNivel === nivelNumero;
        });

        if (!nivelEncontrado || !Array.isArray(nivelEncontrado.preguntas)) return [];

        const preguntas = nivelEncontrado.preguntas
            .filter(
                (p) =>
                p &&
                typeof p.pregunta === "string" &&
                Array.isArray(p.opciones) &&
                typeof p.correcta === "number"
            )
            .map((p, i) => ({
                id: typeof p.id === "string" ?
                    p.id :
                    crypto.createHash("md5").update(p.pregunta + i).digest("hex"),
                pregunta: p.pregunta,
                opciones: p.opciones,
                correcta: p.correcta,
            }));

        // Mezclar preguntas
        preguntas.sort(() => Math.random() - 0.5);

        return preguntas.slice(0, cantidad);
    } catch (error) {
        console.error("❌ Error obtenerPreguntasNivel:", error);
        return [];
    }
}

/* =====================================================
   🔢 TOTAL DE NIVELES DEL CURSO
===================================================== */
async function obtenerTotalNivelesCurso(cursoId) {
    try {
        if (!cursoId) return 0;

        const snap = await db.collection("cursos").doc(cursoId).get();
        if (!snap.exists) return 0;

        const data = snap.data();
        if (!data || !Array.isArray(data.niveles)) return 0;

        return data.niveles.reduce((max, nivel, i) => {
            const numeroNivel =
                nivel && nivel.numero !== undefined && nivel.numero !== null ?
                Number(nivel.numero) :
                i + 1;
            return numeroNivel > max ? numeroNivel : max;
        }, 0);
    } catch (error) {
        console.error("❌ Firebase obtenerTotalNivelesCurso:", error);
        return 0;
    }
}

/* =====================================================
   📘 OBTENER CURSO POR ID
===================================================== */
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