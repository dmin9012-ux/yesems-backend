const ProgresoCurso = require("../models/ProgresoCurso");

const {
    obtenerTotalNivelesCurso,
    obtenerCursoPorId,
} = require("../services/firebaseCursos");

const {
    obtenerPreguntasNivel,
} = require("../services/firebaseExamenes");

/* =====================================================
   📘 OBTENER EXAMEN DE UN NIVEL
===================================================== */
exports.obtenerExamenNivel = async(req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { cursoId, nivel } = req.params;
        const nivelNumero = Number(nivel);

        if (!cursoId || Number.isNaN(nivelNumero)) {
            return res.status(400).json({
                ok: false,
                message: "Parametros invalidos",
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
                nivelesAprobados: [],
                nivelesConLeccionesCompletas: [],
                intentosExamen: [],
            });
            await progreso.save();
        }

        /* =====================================
           🔐 VALIDACIONES DE ACCESO
        ===================================== */
        if (!progreso.nivelesDesbloqueados.includes(nivelNumero)) {
            return res.status(403).json({
                ok: false,
                message: "Nivel no desbloqueado",
            });
        }

        if (progreso.nivelesAprobados.includes(nivelNumero)) {
            return res.status(403).json({
                ok: false,
                message: "Nivel ya aprobado",
            });
        }

        if (!progreso.nivelesConLeccionesCompletas.includes(nivelNumero)) {
            return res.status(403).json({
                ok: false,
                message: "Debes completar todas las lecciones antes del examen",
            });
        }

        /* =====================================
           🔁 INTENTO ACTIVO
        ===================================== */
        const intentoActivo = [...progreso.intentosExamen]
            .reverse()
            .find(
                (i) => i.nivel === nivelNumero && i.finalizado === false
            );

        if (intentoActivo) {
            return res.json({
                ok: true,
                cursoId,
                nivel: nivelNumero,
                preguntas: intentoActivo.preguntas.map((p) => ({
                    id: p.id,
                    pregunta: p.pregunta,
                    opciones: p.opciones,
                })),
            });
        }

        /* =====================================
           🎯 NUEVO INTENTO
        ===================================== */
        const preguntasBase = await obtenerPreguntasNivel(
            cursoId,
            nivelNumero,
            10
        );

        if (!Array.isArray(preguntasBase) || preguntasBase.length === 0) {
            return res.status(404).json({
                ok: false,
                message: "No hay preguntas disponibles para este nivel",
            });
        }

        const nuevoIntento = {
            nivel: nivelNumero,
            preguntas: preguntasBase.map((p) => ({
                id: p.id,
                pregunta: p.pregunta,
                opciones: p.opciones,
                correcta: p.correcta,
            })),
            respuestas: [],
            aprobado: false,
            porcentaje: 0,
            finalizado: false,
            fecha: new Date(),
        };

        progreso.intentosExamen.push(nuevoIntento);
        await progreso.save();

        return res.json({
            ok: true,
            cursoId,
            nivel: nivelNumero,
            preguntas: nuevoIntento.preguntas.map((p) => ({
                id: p.id,
                pregunta: p.pregunta,
                opciones: p.opciones,
            })),
        });
    } catch (error) {
        console.error("Error obtenerExamenNivel:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al obtener el examen",
        });
    }
};

/* =====================================================
   📝 ENVIAR Y VALIDAR EXAMEN
===================================================== */
exports.enviarExamenNivel = async(req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { cursoId, nivel } = req.params;
        const nivelNumero = Number(nivel);
        const respuestas = Array.isArray(req.body.respuestas) ?
            req.body.respuestas :
            [];

        const progreso = await ProgresoCurso.findOne({
            usuario: usuarioId,
            cursoId,
        });

        if (!progreso) {
            return res.status(404).json({
                ok: false,
                message: "Progreso no encontrado",
            });
        }

        const intento = [...progreso.intentosExamen]
            .reverse()
            .find(
                (i) => i.nivel === nivelNumero && i.finalizado === false
            );

        if (!intento) {
            return res.status(400).json({
                ok: false,
                message: "No existe un intento activo para este nivel",
            });
        }

        let correctas = 0;

        intento.preguntas.forEach((p) => {
            const r = respuestas.find(
                (res) =>
                res &&
                res.preguntaId === p.id &&
                res.respuesta === p.correcta
            );
            if (r) correctas++;
        });

        const porcentaje = Math.round(
            (correctas / intento.preguntas.length) * 100
        );

        /* =====================================
           🎯 MINIMO DE APROBACION
        ===================================== */
        let minimoAprobacion = 80;
        const curso = await obtenerCursoPorId(cursoId);

        if (curso && Array.isArray(curso.niveles)) {
            curso.niveles.forEach((n, i) => {
                const numeroNivel =
                    n.numero !== undefined ? Number(n.numero) : i + 1;

                if (
                    numeroNivel === nivelNumero &&
                    n.examen &&
                    typeof n.examen.minimoAprobacion === "number"
                ) {
                    minimoAprobacion = n.examen.minimoAprobacion;
                }
            });
        }

        const aprobado = porcentaje >= minimoAprobacion;

        intento.respuestas = respuestas;
        intento.porcentaje = porcentaje;
        intento.aprobado = aprobado;
        intento.finalizado = true;

        let cursoFinalizado = false;

        if (aprobado) {
            if (!progreso.nivelesAprobados.includes(nivelNumero)) {
                progreso.nivelesAprobados.push(nivelNumero);
            }

            const totalNiveles = await obtenerTotalNivelesCurso(cursoId);
            const siguienteNivel = nivelNumero + 1;

            if (siguienteNivel <= totalNiveles) {
                if (!progreso.nivelesDesbloqueados.includes(siguienteNivel)) {
                    progreso.nivelesDesbloqueados.push(siguienteNivel);
                }
            } else {
                progreso.completado = true;
                progreso.fechaFinalizacion = new Date();
                cursoFinalizado = true;
            }
        }

        await progreso.save();

        return res.json({
            ok: true,
            aprobado,
            porcentaje,
            minimoAprobacion,
            cursoFinalizado,
        });
    } catch (error) {
        console.error("Error enviarExamenNivel:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al validar el examen",
        });
    }
};

/* =====================================================
   🔓 VERIFICAR ACCESO A NIVEL
===================================================== */
exports.puedeAccederNivel = async(req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { cursoId, nivel } = req.params;
        const nivelNumero = Number(nivel);

        const progreso = await ProgresoCurso.findOne({
            usuario: usuarioId,
            cursoId,
        });

        let puedeAcceder = false;
        let cursoFinalizado = false;

        if (progreso) {
            puedeAcceder =
                progreso.nivelesDesbloqueados.includes(nivelNumero) &&
                progreso.nivelesConLeccionesCompletas.includes(nivelNumero) &&
                !progreso.nivelesAprobados.includes(nivelNumero);

            cursoFinalizado = progreso.completado === true;
        } else {
            puedeAcceder = nivelNumero === 1;
        }

        return res.json({
            ok: true,
            puedeAcceder,
            cursoFinalizado,
        });
    } catch (error) {
        console.error("Error puedeAccederNivel:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al verificar acceso al nivel",
        });
    }
};