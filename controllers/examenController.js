const ProgresoCurso = require("../models/ProgresoCurso");
const {
    obtenerPreguntasNivel,
    obtenerTotalNivelesCurso,
    obtenerLeccionesNivel,
} = require("../services/firebaseCursos");

/* =====================================================
   📘 OBTENER EXAMEN DE UN NIVEL
   (MISMAS 10 PREGUNTAS, orden variable)
===================================================== */
exports.obtenerExamenNivel = async function(req, res) {
    try {
        const usuarioId = req.usuario.id;
        const cursoId = req.params.cursoId;
        const nivel = Number(req.params.nivel);

        if (!cursoId || !nivel) {
            return res.status(400).json({
                ok: false,
                message: "cursoId y nivel son obligatorios",
            });
        }

        // 🔍 Obtener preguntas desde Firebase
        const preguntasBase = await obtenerPreguntasNivel(cursoId, nivel, 10);

        if (!Array.isArray(preguntasBase) || preguntasBase.length === 0) {
            return res.status(404).json({
                ok: false,
                message: "No hay preguntas disponibles para este nivel",
            });
        }

        // 🔹 Buscar o crear progreso
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

        // 🔒 Si ya aprobó el nivel
        if (progreso.nivelesAprobados.indexOf(nivel) !== -1) {
            return res.status(403).json({
                ok: false,
                message: "Este nivel ya fue aprobado",
            });
        }

        // 🔍 Buscar intento activo (sin respuestas)
        let intento = null;
        for (let i = progreso.intentosExamen.length - 1; i >= 0; i--) {
            if (progreso.intentosExamen[i].nivel === nivel && progreso.intentosExamen[i].respuestas.length === 0) {
                intento = progreso.intentosExamen[i];
                break;
            }
        }

        // 🆕 Crear intento si no existe
        if (!intento) {
            intento = {
                nivel: nivel,
                preguntas: [],
                respuestas: [],
                aprobado: false,
                porcentaje: 0,
                fecha: new Date(),
            };

            for (let i = 0; i < preguntasBase.length; i++) {
                const p = preguntasBase[i];
                intento.preguntas.push({
                    id: p.id,
                    pregunta: p.pregunta,
                    opciones: p.opciones,
                    correcta: p.correcta,
                });
            }

            progreso.intentosExamen.push(intento);
            await progreso.save();
        }

        // 🔀 Reordenar solo para mostrar
        const preguntasParaMostrar = intento.preguntas.slice();
        preguntasParaMostrar.sort(function() { return Math.random() - 0.5; });

        // 🔹 Responder sin la propiedad 'correcta'
        const preguntasFinal = [];
        for (let i = 0; i < preguntasParaMostrar.length; i++) {
            preguntasFinal.push({
                id: preguntasParaMostrar[i].id,
                pregunta: preguntasParaMostrar[i].pregunta,
                opciones: preguntasParaMostrar[i].opciones,
            });
        }

        return res.json({
            ok: true,
            cursoId: cursoId,
            nivel: nivel,
            preguntas: preguntasFinal,
        });

    } catch (error) {
        console.error("❌ Error obtenerExamenNivel:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al obtener el examen",
        });
    }
};

/* =====================================================
   📝 ENVIAR EXAMEN DE UN NIVEL
===================================================== */
exports.enviarExamenNivel = async function(req, res) {
    try {
        const usuarioId = req.usuario.id;
        const cursoId = req.params.cursoId;
        const nivel = Number(req.params.nivel);
        const respuestas = req.body.respuestas;

        if (!Array.isArray(respuestas) || respuestas.length === 0) {
            return res.status(400).json({
                ok: false,
                message: "Debes enviar las respuestas",
            });
        }

        const progreso = await ProgresoCurso.findOne({ usuario: usuarioId, cursoId });
        if (!progreso) {
            return res.status(404).json({
                ok: false,
                message: "Progreso no encontrado",
            });
        }

        // 🔒 Validar lecciones completadas
        const leccionesNivel = await obtenerLeccionesNivel(cursoId, nivel);
        const completadas = [];
        for (let i = 0; i < progreso.leccionesCompletadas.length; i++) {
            if (leccionesNivel.indexOf(progreso.leccionesCompletadas[i]) !== -1) {
                completadas.push(progreso.leccionesCompletadas[i]);
            }
        }

        if (completadas.length !== leccionesNivel.length) {
            return res.status(403).json({
                ok: false,
                message: "Debes completar todas las lecciones del nivel antes del examen",
            });
        }

        // 🎯 Buscar intento activo
        let intento = null;
        for (let i = progreso.intentosExamen.length - 1; i >= 0; i--) {
            if (progreso.intentosExamen[i].nivel === nivel && progreso.intentosExamen[i].respuestas.length === 0) {
                intento = progreso.intentosExamen[i];
                break;
            }
        }

        if (!intento) {
            return res.status(400).json({
                ok: false,
                message: "No se encontró intento válido",
            });
        }

        // 🔹 Calcular respuestas correctas
        let correctas = 0;
        for (let i = 0; i < respuestas.length; i++) {
            const r = respuestas[i];
            for (let j = 0; j < intento.preguntas.length; j++) {
                const p = intento.preguntas[j];
                if (p.id === r.preguntaId && p.correcta === r.respuesta) {
                    correctas++;
                    break;
                }
            }
        }

        const total = intento.preguntas.length;
        const porcentaje = Math.round((correctas / total) * 100);
        const aprobado = porcentaje >= 80;

        intento.respuestas = respuestas;
        intento.aprobado = aprobado;
        intento.porcentaje = porcentaje;

        // 🔹 Actualizar progreso
        let cursoFinalizado = false;
        let siguienteNivel = null;

        if (aprobado) {
            if (progreso.nivelesAprobados.indexOf(nivel) === -1) {
                progreso.nivelesAprobados.push(nivel);
            }

            const totalNiveles = await obtenerTotalNivelesCurso(cursoId);
            if (nivel === totalNiveles) {
                progreso.completado = true;
                progreso.fechaFinalizacion = new Date();
                cursoFinalizado = true;
            } else {
                siguienteNivel = nivel + 1;
            }
        }

        await progreso.save();

        return res.json({
            ok: true,
            aprobado: aprobado,
            porcentaje: porcentaje,
            siguienteNivel: siguienteNivel,
            cursoFinalizado: cursoFinalizado,
            mensaje: cursoFinalizado ?
                "🎓 Curso finalizado" : aprobado ? "🎉 Examen aprobado" : "❌ No alcanzaste el 80%",
        });

    } catch (error) {
        console.error("❌ Error enviarExamenNivel:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al validar examen",
        });
    }
};

/* =====================================================
   🔹 VERIFICAR SI EL USUARIO PUEDE ACCEDER A UN NIVEL
===================================================== */
exports.puedeAccederNivel = async function(req, res) {
    try {
        const usuarioId = req.usuario.id;
        const cursoId = req.params.cursoId;
        const nivel = Number(req.params.nivel);

        if (!cursoId || !nivel) {
            return res.status(400).json({
                ok: false,
                message: "cursoId y nivel son obligatorios",
            });
        }

        const progreso = await ProgresoCurso.findOne({ usuario: usuarioId, cursoId });
        if (!progreso) {
            return res.status(200).json({
                ok: true,
                puedeAcceder: nivel === 1, // primer nivel accesible aunque no haya progreso
            });
            return;
        }

        const nivelAnterior = nivel - 1;
        const puedeAcceder = (nivelAnterior === 0) || (progreso.nivelesAprobados.indexOf(nivelAnterior) !== -1);

        return res.json({
            ok: true,
            puedeAcceder: puedeAcceder,
        });

    } catch (error) {
        console.error("❌ Error puedeAccederNivel:", error);
        return res.status(500).json({
            ok: false,
            message: "Error interno al verificar acceso",
        });
    }
};