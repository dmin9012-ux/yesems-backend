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
        const cursoId = req.body.cursoId;
        const leccionId = req.body.leccionId;

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

        // Validar que la lección exista
        let leccionValida = false;
        for (let i = 0; i < leccionesCurso.length; i++) {
            if (leccionesCurso[i] === leccionId) {
                leccionValida = true;
                break;
            }
        }
        if (!leccionValida) {
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
            progreso = await ProgresoCurso.create({
                usuario: usuarioId,
                cursoId,
                leccionesCompletadas: [],
                nivelesAprobados: [],
                intentosExamen: [],
                completado: false,
            });
        }

        // Validar examen del nivel anterior
        let examenAnteriorAprobado = true;
        if (nivelLeccion > 1) {
            examenAnteriorAprobado = false;
            for (let i = 0; i < progreso.nivelesAprobados.length; i++) {
                if (progreso.nivelesAprobados[i] === nivelLeccion - 1) {
                    examenAnteriorAprobado = true;
                    break;
                }
            }
        }

        if (!examenAnteriorAprobado) {
            return res.status(403).json({
                ok: false,
                message: "Debes aprobar el examen del nivel anterior para validar esta lección",
            });
        }

        // Verificar si ya fue validada
        let yaValidada = false;
        for (let i = 0; i < progreso.leccionesCompletadas.length; i++) {
            if (progreso.leccionesCompletadas[i] === leccionId) {
                yaValidada = true;
                break;
            }
        }

        if (yaValidada) {
            return res.json({
                ok: true,
                alreadyValidated: true,
                data: progreso,
            });
        }

        // Marcar como completada
        progreso.leccionesCompletadas.push(leccionId);

        // Revisar si todas las lecciones están completadas
        let todasCompletadas = true;
        for (let i = 0; i < leccionesCurso.length; i++) {
            let id = leccionesCurso[i];
            if (progreso.leccionesCompletadas.indexOf(id) === -1) {
                todasCompletadas = false;
                break;
            }
        }

        if (todasCompletadas) {
            progreso.completado = true;
            progreso.fechaFinalizacion = new Date();
        }

        await progreso.save();

        // Sincronizar con usuario
        await Usuario.findByIdAndUpdate(
            usuarioId, { $addToSet: { leccionesValidadas: leccionId } }, { new: true }
        );

        return res.json({
            ok: true,
            message: "Lección validada correctamente",
            data: progreso,
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
        const cursoId = req.params.cursoId;

        if (!cursoId) {
            return res.status(400).json({
                ok: false,
                message: "cursoId es obligatorio",
            });
        }

        let progreso = await ProgresoCurso.findOne({ usuario: usuarioId, cursoId });

        if (!progreso) {
            // Crear progreso vacío si no existe
            progreso = await ProgresoCurso.create({
                usuario: usuarioId,
                cursoId,
                leccionesCompletadas: [],
                nivelesAprobados: [],
                intentosExamen: [],
                completado: false,
            });
        }

        return res.json({
            ok: true,
            data: progreso,
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
            data: progresos,
        });
    } catch (error) {
        console.error("❌ Error obtenerMisProgresos:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al obtener progresos",
        });
    }
};