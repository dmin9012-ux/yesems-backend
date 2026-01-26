// controllers/progresoController.js
const ProgresoCurso = require("../models/ProgresoCurso");
const Usuario = require("../models/Usuario");
const {
    obtenerLeccionesCurso,
    obtenerNivelDeLeccion,
} = require("../services/firebaseCursos");

/* =========================================
   🔥 VALIDAR LECCIÓN
========================================= */
exports.validarLeccion = async(req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { cursoId, leccionId } = req.body;

        if (!cursoId || !leccionId) {
            return res.status(400).json({
                ok: false,
                message: "cursoId y leccionId son obligatorios",
            });
        }

        const leccionesCurso = await obtenerLeccionesCurso(cursoId);

        if (!Array.isArray(leccionesCurso) || leccionesCurso.length === 0) {
            return res.status(404).json({
                ok: false,
                message: "Curso no encontrado o sin lecciones",
            });
        }

        if (!leccionesCurso.includes(leccionId)) {
            return res.status(400).json({
                ok: false,
                message: "La lección no pertenece a este curso",
            });
        }

        const nivelLeccion = await obtenerNivelDeLeccion(cursoId, leccionId);

        if (typeof nivelLeccion !== "number") {
            return res.status(400).json({
                ok: false,
                message: "No se pudo determinar el nivel de la lección",
            });
        }

        let progreso = await ProgresoCurso.findOne({ usuario: usuarioId, cursoId });

        if (!progreso) {
            progreso = new ProgresoCurso({
                usuario: usuarioId,
                cursoId,
                leccionesCompletadas: [],
                nivelesAprobados: [],
                intentosExamen: [],
                completado: false,
            });
        }

        // 🔒 Control de avance por niveles
        if (nivelLeccion > 1) {
            const nivelAnterior = nivelLeccion - 1;
            if (!progreso.nivelesAprobados.includes(nivelAnterior)) {
                return res.status(403).json({
                    ok: false,
                    message: `Debes aprobar el examen del nivel ${nivelAnterior}`,
                });
            }
        }

        // 🔁 Ya validada → OK silencioso
        if (progreso.leccionesCompletadas.includes(leccionId)) {
            return res.json({
                ok: true,
                alreadyValidated: true,
                data: progreso, // <-- aquí cambiamos a 'data'
            });
        }

        progreso.leccionesCompletadas.push(leccionId);
        await progreso.save();

        await Usuario.findByIdAndUpdate(
            usuarioId, { $addToSet: { leccionesValidadas: leccionId } }, { new: true }
        );

        return res.json({
            ok: true,
            message: "Lección validada correctamente",
            data: progreso, // <-- aquí también
        });
    } catch (error) {
        console.error("❌ Error validarLeccion:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al validar lección",
        });
    }
};

/* =========================================
   📌 OBTENER PROGRESO DE UN CURSO
========================================= */
exports.obtenerProgresoCurso = async(req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { cursoId } = req.params;

        if (!cursoId) {
            return res.status(400).json({
                ok: false,
                message: "cursoId es obligatorio",
            });
        }

        const progreso = await ProgresoCurso.findOne({
            usuario: usuarioId,
            cursoId,
        });

        if (!progreso) {
            return res.status(404).json({
                ok: false,
                message: "No se encontró progreso para este curso",
            });
        }

        return res.json({
            ok: true,
            data: progreso, // <-- cambio a 'data'
        });
    } catch (error) {
        console.error("❌ Error obtenerProgresoCurso:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al obtener progreso del curso",
        });
    }
};

/* =========================================
   📌 OBTENER TODOS MIS PROGRESOS
========================================= */
exports.obtenerMisProgresos = async(req, res) => {
    try {
        const usuarioId = req.usuario.id;

        const progresos = await ProgresoCurso.find({ usuario: usuarioId });

        return res.json({
            ok: true,
            data: progresos, // <-- cambio a 'data'
        });
    } catch (error) {
        console.error("❌ Error obtenerMisProgresos:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al obtener progresos",
        });
    }
};