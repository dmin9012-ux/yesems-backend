const ProgresoCurso = require("../models/ProgresoCurso");
const Usuario = require("../models/Usuario");
const {
    obtenerLeccionesCurso,
    obtenerNivelDeLeccion,
    obtenerLeccionesNivel,
    obtenerTotalNivelesCurso,
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
        if (!leccionesCurso.length) {
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
            progreso = new ProgresoCurso({ usuario: usuarioId, cursoId });
        }

        // 🔒 Verificar desbloqueo del nivel
        if (nivelLeccion > 1) {
            const nivelAnterior = nivelLeccion - 1;
            if (!progreso.nivelesAprobados.includes(nivelAnterior)) {
                return res.status(403).json({
                    ok: false,
                    message: `Debes aprobar el examen del nivel ${nivelAnterior}`,
                });
            }
        }

        // 🔁 Ya validada
        if (progreso.leccionesCompletadas.includes(leccionId)) {
            return res.json({
                ok: true,
                alreadyValidated: true,
                progreso,
            });
        }

        progreso.leccionesCompletadas.push(leccionId);

        // 📘 Validar si el nivel ya está completo
        const leccionesNivel = await obtenerLeccionesNivel(cursoId, nivelLeccion);
        const nivelCompleto = leccionesNivel.every((l) =>
            progreso.leccionesCompletadas.includes(l)
        );

        if (nivelCompleto && !progreso.nivelesConLeccionesCompletas.includes(nivelLeccion)) {
            progreso.nivelesConLeccionesCompletas.push(nivelLeccion);
        }

        await progreso.save();

        // Actualizar usuario con lecciones validadas
        await Usuario.findByIdAndUpdate(
            usuarioId, { $addToSet: { leccionesValidadas: leccionId } }, { new: true }
        );

        return res.json({
            ok: true,
            message: "Lección validada correctamente",
            progreso,
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
            return res.status(400).json({ ok: false, message: "cursoId es obligatorio" });
        }

        let progreso = await ProgresoCurso.findOne({ usuario: usuarioId, cursoId });
        if (!progreso) {
            progreso = new ProgresoCurso({ usuario: usuarioId, cursoId });
            await progreso.save();
        }

        const leccionesCurso = await obtenerLeccionesCurso(cursoId);
        const totalNiveles = await obtenerTotalNivelesCurso(cursoId);

        const progresoCurso = leccionesCurso.length ?
            Math.round((progreso.leccionesCompletadas.length / leccionesCurso.length) * 100) :
            0;

        // 🏁 Marcar curso completado
        if (
            leccionesCurso.length &&
            progreso.leccionesCompletadas.length === leccionesCurso.length &&
            progreso.nivelesAprobados.length === totalNiveles &&
            !progreso.completado
        ) {
            progreso.completado = true;
            progreso.fechaFinalizacion = new Date();
            await progreso.save();
        }

        return res.json({
            ok: true,
            progreso,
            estadisticas: {
                progresoCurso,
                totalLecciones: leccionesCurso.length,
                leccionesCompletadas: progreso.leccionesCompletadas.length,
                nivelesConLeccionesCompletas: progreso.nivelesConLeccionesCompletas,
                nivelesAprobados: progreso.nivelesAprobados,
                nivelesDesbloqueados: progreso.nivelesDesbloqueados,
                totalNiveles,
            },
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
        return res.json({ ok: true, progresos });
    } catch (error) {
        console.error("❌ Error obtenerMisProgresos:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al obtener progresos",
        });
    }
};