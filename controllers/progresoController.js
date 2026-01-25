const ProgresoCurso = require("../models/ProgresoCurso");
const Usuario = require("../models/Usuario");

const {
    obtenerLeccionesCurso,
    obtenerLeccionesNivel,
    obtenerNivelDeLeccion,
} = require("../services/firebaseCursos");

/* =========================================
   VALIDAR LECCION
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
                message: "La leccion no pertenece a este curso",
            });
        }

        const nivelLeccion = await obtenerNivelDeLeccion(cursoId, leccionId);

        if (typeof nivelLeccion !== "number") {
            return res.status(400).json({
                ok: false,
                message: "No se pudo determinar el nivel de la leccion",
            });
        }

        let progreso = await ProgresoCurso.findOne({
            usuario: usuarioId,
            cursoId,
        });

        if (!progreso) {
            progreso = new ProgresoCurso({
                usuario: usuarioId,
                cursoId,
                leccionesCompletadas: [],
                nivelesConLeccionesCompletas: [],
                nivelesAprobados: [],
                nivelesDesbloqueados: [1],
                intentosExamen: [],
                completado: false,
            });
        }

        /* =====================================
           CONTROL DE AVANCE POR NIVELES
        ===================================== */
        if (nivelLeccion > 1) {
            const nivelAnterior = nivelLeccion - 1;

            if (!progreso.nivelesAprobados.includes(nivelAnterior)) {
                return res.status(403).json({
                    ok: false,
                    message: `Debes aprobar el examen del nivel ${nivelAnterior}`,
                });
            }
        }

        /* =====================================
           LECCION YA VALIDADA
        ===================================== */
        if (progreso.leccionesCompletadas.includes(leccionId)) {
            return res.json({
                ok: true,
                alreadyValidated: true,
                progreso,
            });
        }

        progreso.leccionesCompletadas.push(leccionId);

        /* =====================================
           VERIFICAR SI EL NIVEL ESTA COMPLETO
        ===================================== */
        const leccionesNivel = await obtenerLeccionesNivel(
            cursoId,
            nivelLeccion
        );

        const nivelCompleto =
            Array.isArray(leccionesNivel) &&
            leccionesNivel.length > 0 &&
            leccionesNivel.every((l) =>
                progreso.leccionesCompletadas.includes(l)
            );

        if (
            nivelCompleto &&
            !progreso.nivelesConLeccionesCompletas.includes(nivelLeccion)
        ) {
            progreso.nivelesConLeccionesCompletas.push(nivelLeccion);
        }

        await progreso.save();

        /* =====================================
           GUARDAR EN USUARIO
        ===================================== */
        await Usuario.findByIdAndUpdate(
            usuarioId, { $addToSet: { leccionesValidadas: leccionId } }
        );

        return res.json({
            ok: true,
            message: "Leccion validada correctamente",
            progreso,
        });
    } catch (error) {
        console.error("Error validarLeccion:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al validar leccion",
        });
    }
};

/* =========================================
   OBTENER PROGRESO DE UN CURSO
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

        let progreso = await ProgresoCurso.findOne({
            usuario: usuarioId,
            cursoId,
        });

        if (!progreso) {
            progreso = new ProgresoCurso({
                usuario: usuarioId,
                cursoId,
                nivelesDesbloqueados: [1],
            });
            await progreso.save();
        }

        return res.json({
            ok: true,
            progreso,
        });
    } catch (error) {
        console.error("Error obtenerProgresoCurso:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al obtener progreso del curso",
        });
    }
};

/* =========================================
   OBTENER TODOS MIS PROGRESOS
========================================= */
exports.obtenerMisProgresos = async(req, res) => {
    try {
        const usuarioId = req.usuario.id;

        const progresos = await ProgresoCurso.find({
            usuario: usuarioId,
        });

        return res.json({
            ok: true,
            progresos,
        });
    } catch (error) {
        console.error("Error obtenerMisProgresos:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al obtener progresos",
        });
    }
};