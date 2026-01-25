const { db } = require("../config/firebase");

/* =====================================================
   🔥 OBTENER TODAS LAS LECCIONES DE UN CURSO
===================================================== */
async function obtenerLeccionesCurso(cursoId) {
    try {
        if (!cursoId) return [];

        const snap = await db.collection("cursos").doc(cursoId).get();
        if (!snap.exists) return [];

        const data = snap.data();
        if (!data || !Array.isArray(data.niveles)) return [];

        const lecciones = [];

        data.niveles.forEach((nivel, i) => {
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
   🧩 OBTENER LECCIONES DE UN NIVEL
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
   🔍 OBTENER NIVEL DE UNA LECCIÓN
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

            const encontrada = nivel.lecciones.some(
                (l) => l && l.id === leccionId
            );

            if (encontrada) return numeroNivel;
        }

        return null;
    } catch (error) {
        console.error("❌ Firebase obtenerNivelDeLeccion:", error);
        return null;
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

        let maxNivel = 0;

        data.niveles.forEach((nivel, i) => {
            if (!nivel) return;

            const numeroNivel =
                nivel.numero !== undefined && nivel.numero !== null ?
                Number(nivel.numero) :
                i + 1;

            if (numeroNivel > maxNivel) {
                maxNivel = numeroNivel;
            }
        });

        return maxNivel;
    } catch (error) {
        console.error("❌ Firebase obtenerTotalNivelesCurso:", error);
        return 0;
    }
}

/* =====================================================
   📘 OBTENER CURSO POR ID (SIN PREGUNTAS)
===================================================== */
async function obtenerCursoPorId(cursoId) {
    try {
        if (!cursoId) return null;

        const snap = await db.collection("cursos").doc(cursoId).get();
        if (!snap.exists) return null;

        const data = snap.data();
        if (!data) return null;

        // Seguridad: no exponer preguntas aunque existan
        if (Array.isArray(data.niveles)) {
            data.niveles = data.niveles.map((nivel) => {
                if (!nivel) return nivel;
                const copia = {...nivel };
                delete copia.preguntas;
                return copia;
            });
        }

        return data;
    } catch (error) {
        console.error("❌ Firebase obtenerCursoPorId:", error);
        return null;
    }
}

module.exports = {
    obtenerLeccionesCurso,
    obtenerLeccionesNivel,
    obtenerNivelDeLeccion,
    obtenerTotalNivelesCurso,
    obtenerCursoPorId,
};