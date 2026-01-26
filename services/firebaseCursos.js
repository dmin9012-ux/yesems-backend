// services/firebaseCursos.js
const { db } = require("./firebase");

/* =====================================================
    🧩 GENERAR ID CANÓNICO DE LECCIÓN
===================================================== */
function generarLeccionId(cursoId, nivelNumero, leccionNumero) {
    return cursoId + "-n" + nivelNumero + "-l" + leccionNumero;
}

/* =====================================================
    🔥 OBTENER TODAS LAS LECCIONES DE UN CURSO
===================================================== */
async function obtenerLeccionesCurso(cursoId) {
    try {
        if (!cursoId) return [];

        const snap = await db.collection("cursos").doc(cursoId).get();
        if (!snap.exists) return [];

        const data = snap.data();
        // Validación tradicional sin ?.
        if (!data || !data.niveles || !Array.isArray(data.niveles)) return [];

        const lecciones = [];

        data.niveles.forEach(function(nivel, index) {
            var nivelNumero = (nivel.numero !== undefined && nivel.numero !== null) ? nivel.numero : index + 1;
            if (nivel.lecciones && Array.isArray(nivel.lecciones)) {
                nivel.lecciones.forEach(function(_, j) {
                    lecciones.push(generarLeccionId(cursoId, nivelNumero, j + 1));
                });
            }
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
        if (!data || !data.niveles || !Array.isArray(data.niveles)) return [];

        // Búsqueda manual para evitar .find() con ?.
        var nivelEncontrado = null;
        for (var i = 0; i < data.niveles.length; i++) {
            var n = data.niveles[i];
            var num = (n.numero !== undefined && n.numero !== null) ? n.numero : i + 1;
            if (Number(num) === Number(nivelNumero)) {
                nivelEncontrado = n;
                break;
            }
        }

        if (!nivelEncontrado || !nivelEncontrado.lecciones || !Array.isArray(nivelEncontrado.lecciones)) {
            return [];
        }

        return nivelEncontrado.lecciones.map(function(_, i) {
            return generarLeccionId(cursoId, nivelNumero, i + 1);
        });
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
        if (!data || !data.niveles || !Array.isArray(data.niveles)) return null;

        for (var i = 0; i < data.niveles.length; i++) {
            var nivel = data.niveles[i];
            var nivelNumero = (nivel.numero !== undefined && nivel.numero !== null) ? nivel.numero : i + 1;

            if (nivel.lecciones && Array.isArray(nivel.lecciones)) {
                for (var j = 0; j < nivel.lecciones.length; j++) {
                    if (generarLeccionId(cursoId, nivelNumero, j + 1) === leccionId) {
                        return Number(nivelNumero);
                    }
                }
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
async function obtenerPreguntasNivel(cursoId, nivelNumero, cantidad) {
    try {
        if (!cantidad) cantidad = 10;
        const snapCurso = await db.collection("cursos").doc(cursoId).get();
        if (!snapCurso.exists) return [];

        const data = snapCurso.data();
        if (!data || !data.niveles || !Array.isArray(data.niveles)) return [];

        var nivelEncontrado = null;
        for (var i = 0; i < data.niveles.length; i++) {
            var n = data.niveles[i];
            var num = (n.numero !== undefined && n.numero !== null) ? n.numero : i + 1;
            if (Number(num) === Number(nivelNumero)) {
                nivelEncontrado = n;
                break;
            }
        }

        if (!nivelEncontrado || !nivelEncontrado.preguntas || !Array.isArray(nivelEncontrado.preguntas)) {
            return [];
        }

        var preguntas = [];
        nivelEncontrado.preguntas.forEach(function(p) {
            if (p && p.pregunta && Array.isArray(p.opciones)) {
                preguntas.push({
                    id: p.id,
                    pregunta: p.pregunta,
                    opciones: p.opciones,
                    correcta: (p.correcta !== undefined && p.correcta !== null) ? p.correcta : 0
                });
            }
        });

        // Mezclar y limitar
        return preguntas.sort(function() { return Math.random() - 0.5; }).slice(0, cantidad);
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
        const snap = await db.collection("cursos").doc(cursoId).get();
        if (!snap.exists) return 0;

        const data = snap.data();
        if (!data || !data.niveles || !Array.isArray(data.niveles)) return 0;

        var maxNivel = 0;
        data.niveles.forEach(function(n, index) {
            var num = (n.numero !== undefined && n.numero !== null) ? n.numero : index + 1;
            if (Number(num) > maxNivel) {
                maxNivel = Number(num);
            }
        });

        return maxNivel;
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