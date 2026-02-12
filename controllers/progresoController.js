// controllers/progresoController.js
const ProgresoCurso = require("../models/ProgresoCurso");
const Usuario = require("../models/Usuario");
const {
    obtenerLeccionesCurso,
    obtenerNivelDeLeccion,
} = require("../services/firebaseCursos");

/* =========================================
    🔥 VALIDAR LECCIÓN
    Este controlador se encarga de marcar una lección como vista.
    El acceso ya fue filtrado por el middleware de suscripción.
========================================= */
exports.validarLeccion = async(req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { cursoId, leccionId } = req.body;

        // 1. Validaciones de entrada
        if (!cursoId || !leccionId) {
            return res.status(400).json({
                ok: false,
                message: "cursoId y leccionId son obligatorios",
            });
        }

        // 2. Verificar existencia de la lección en Firebase
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

        // 3. Obtener el nivel de la lección actual
        const nivelLeccion = await obtenerNivelDeLeccion(cursoId, leccionId);

        // 4. Buscar o crear el progreso de este curso para el usuario
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

        // 5. Bloqueo por nivel: Validar que el nivel anterior esté aprobado
        if (nivelLeccion > 1) {
            const examenAnteriorAprobado = progreso.nivelesAprobados.includes(nivelLeccion - 1);
            if (!examenAnteriorAprobado) {
                return res.status(403).json({
                    ok: false,
                    message: "Debes aprobar el examen del nivel anterior para validar lecciones de este nivel",
                });
            }
        }

        // 6. Si ya está validada, no hacemos nada más
        if (progreso.leccionesCompletadas.includes(leccionId)) {
            return res.json({
                ok: true,
                alreadyValidated: true,
                data: progreso,
            });
        }

        // 7. Marcar lección como completada en la colección de progreso
        progreso.leccionesCompletadas.push(leccionId);
        progreso.markModified('leccionesCompletadas');
        await progreso.save();

        /* ============================================================
           🔄 SINCRONIZACIÓN CON EL MODELO DE USUARIO (PARA EL PERFIL)
           Añadimos la lección al array global del usuario para que el
           contador de "Lecciones Completadas" suba en el Dashboard.
        ============================================================ */
        const usuarioActualizado = await Usuario.findByIdAndUpdate(
            usuarioId, { $addToSet: { leccionesValidadas: leccionId } }, { new: true } // Para obtener los datos frescos después del update
        );

        return res.json({
            ok: true,
            message: "Lección validada correctamente",
            data: progreso,
            stats: {
                totalGlobal: usuarioActualizado.leccionesValidadas.length
            }
        });

    } catch (error) {
        console.error("❌ Error validarLeccion:", error);
        return res.status(500).json({
            ok: false,
            message: "Error interno al validar lección",
        });
    }
};

/* =========================================
    📌 OBTENER PROGRESO DE UN CURSO ESPECÍFICO
========================================= */
exports.obtenerProgresoCurso = async(req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { cursoId } = req.params;

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
    Utilizado para el contador del Perfil (ej: "3 cursos en curso")
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
            message: "Error al obtener la lista de progresos",
        });
    }
};