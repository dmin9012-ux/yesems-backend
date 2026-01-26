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

        // Bloqueo por nivel: Solo si no es nivel 1, validar que el anterior esté aprobado
        if (nivelLeccion > 1) {
            const examenAnteriorAprobado = progreso.nivelesAprobados.includes(nivelLeccion - 1);
            if (!examenAnteriorAprobado) {
                return res.status(403).json({
                    ok: false,
                    message: "Debes aprobar el examen del nivel anterior",
                });
            }
        }

        // Si ya está validada, devolvemos el progreso actual sin modificar nada
        if (progreso.leccionesCompletadas.includes(leccionId)) {
            return res.json({
                ok: true,
                alreadyValidated: true,
                data: progreso,
            });
        }

        // Marcar lección como completada
        progreso.leccionesCompletadas.push(leccionId);

        // NOTIFICAR A MONGOOSE: Importante para que el cambio se guarde
        progreso.markModified('leccionesCompletadas');

        // NOTA: No marcamos "completado = true" aquí. 
        // Eso solo debe pasar en el examenController al pasar el último nivel.

        await progreso.save();

        // Sincronización con el modelo de Usuario (Para el Perfil)
        await Usuario.findByIdAndUpdate(
            usuarioId, { $addToSet: { leccionesValidadas: leccionId } }
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
        const { cursoId } = req.params;

        // Buscamos el progreso y lo devolvemos tal cual
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
        // Importante: Traer todos los progresos para la vista de Perfil / Dashboard
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