// controllers/examenController.js
const ProgresoCurso = require("../models/ProgresoCurso");
const {
    obtenerPreguntasNivel,
    obtenerTotalNivelesCurso,
    obtenerLeccionesNivel,
} = require("../services/firebaseCursos");

/* =====================================================
   📘 OBTENER EXAMEN DE UN NIVEL
===================================================== */
exports.obtenerExamenNivel = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const cursoId = req.params.cursoId;
        const nivelNumero = Number(req.params.nivel);

        if (!cursoId || isNaN(nivelNumero) || nivelNumero < 1) {
            return res.status(400).json({
                ok: false,
                message: "cursoId y nivel válidos son obligatorios",
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

        // Nivel ya aprobado
        if (progreso.nivelesAprobados.includes(nivelNumero)) {
            return res.status(403).json({
                ok: false,
                message: "Este nivel ya fue aprobado",
            });
        }

        // Validar lecciones completadas
        const leccionesNivel = await obtenerLeccionesNivel(cursoId, nivelNumero);
        const completadas = leccionesNivel.filter(l => progreso.leccionesCompletadas.indexOf(l) !== -1);

        if (completadas.length !== leccionesNivel.length) {
            return res.status(403).json({
                ok: false,
                message: "Debes completar todas las lecciones antes del examen",
            });
        }

        // Intento pendiente
        let intentoPendiente = null;
        for (let i = 0; i < progreso.intentosExamen.length; i++) {
            const it = progreso.intentosExamen[i];
            if (it.nivel === nivelNumero && it.estado === "pendiente") {
                intentoPendiente = it;
                break;
            }
        }

        if (intentoPendiente) {
            const preguntasResp = intentoPendiente.preguntas.map(p => ({
                id: p.id,
                pregunta: p.pregunta,
                opciones: p.opciones,
            }));

            return res.json({
                ok: true,
                cursoId,
                nivel: nivelNumero,
                preguntas: preguntasResp,
            });
        }

        // Crear nuevo intento
        const preguntasBase = await obtenerPreguntasNivel(cursoId, nivelNumero, 10);
        if (!Array.isArray(preguntasBase) || preguntasBase.length === 0) {
            return res.status(404).json({
                ok: false,
                message: "No hay preguntas disponibles para este nivel",
            });
        }

        const preguntasIntento = [];
        for (let i = 0; i < preguntasBase.length; i++) {
            const p = preguntasBase[i];
            preguntasIntento.push({
                id: p.id,
                pregunta: p.pregunta,
                opciones: p.opciones,
                correcta: p.correcta, // se guarda pero no se envía
            });
        }

        const nuevoIntento = {
            nivel: nivelNumero,
            preguntas: preguntasIntento,
            respuestas: [],
            aprobado: false,
            porcentaje: 0,
            fecha: new Date(),
            estado: "pendiente",
        };

        progreso.intentosExamen.push(nuevoIntento);
        await progreso.save();

        const preguntasResp = preguntasIntento.map(p => ({
            id: p.id,
            pregunta: p.pregunta,
            opciones: p.opciones,
        }));

        return res.json({
            ok: true,
            cursoId,
            nivel: nivelNumero,
            preguntas: preguntasResp,
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
exports.enviarExamenNivel = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const cursoId = req.params.cursoId;
        const nivelNumero = Number(req.params.nivel);
        const respuestas = req.body.respuestas;

        let progreso = await ProgresoCurso.findOne({ usuario: usuarioId, cursoId });
        if (!progreso) return res.status(404).json({ ok: false, message: "Progreso no encontrado" });

        if (progreso.nivelesAprobados.indexOf(nivelNumero) !== -1) {
            return res.status(403).json({ ok: false, message: "Este nivel ya fue aprobado" });
        }

        // Último intento pendiente
        let intento = null;
        for (let i = progreso.intentosExamen.length - 1; i >= 0; i--) {
            const it = progreso.intentosExamen[i];
            if (it.nivel === nivelNumero && it.estado === "pendiente") {
                intento = it;
                break;
            }
        }
        if (!intento) return res.status(400).json({ ok: false, message: "Intento de examen no encontrado o ya evaluado" });

        // Calcular respuestas correctas
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

        const porcentaje = Math.round((correctas / intento.preguntas.length) * 100);
        const aprobado = porcentaje >= 80;

        intento.respuestas = respuestas;
        intento.aprobado = aprobado;
        intento.porcentaje = porcentaje;
        intento.estado = "finalizado";

        let siguienteNivel = null;
        let cursoFinalizado = false;

        if (aprobado) {
            if (progreso.nivelesAprobados.indexOf(nivelNumero) === -1) {
                progreso.nivelesAprobados.push(nivelNumero);
            }

            progreso.nivelesAprobados.sort(function (a, b) { return a - b; });

            const totalNiveles = await obtenerTotalNivelesCurso(cursoId);
            if (nivelNumero === totalNiveles) {
                progreso.completado = true;
                progreso.fechaFinalizacion = new Date();
                progreso.constanciaEmitida = true;
                cursoFinalizado = true;
            } else {
                siguienteNivel = nivelNumero + 1;
            }
        }

        await progreso.save();

        return res.json({
            ok: true,
            aprobado: aprobado,
            porcentaje: porcentaje,
            siguienteNivel: siguienteNivel,
            cursoFinalizado: cursoFinalizado,
            progresoActualizado: {
                nivelesAprobados: progreso.nivelesAprobados,
                completado: progreso.completado,
                constanciaEmitida: progreso.constanciaEmitida || false,
            },
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
   🔓 VERIFICAR ACCESO A NIVEL
===================================================== */
exports.puedeAccederNivel = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const cursoId = req.params.cursoId;
        const nivelNumero = Number(req.params.nivel);

        let progreso = await ProgresoCurso.findOne({ usuario: usuarioId, cursoId });

        if (!progreso) {
            return res.json({ ok: true, puedeAcceder: nivelNumero === 1 });
        }

        if (progreso.completado) return res.json({ ok: true, puedeAcceder: false });
        if (nivelNumero === 1) return res.json({ ok: true, puedeAcceder: true });

        const anteriorAprobado = progreso.nivelesAprobados.indexOf(nivelNumero - 1) !== -1;
        if (!anteriorAprobado) {
            return res.json({
                ok: true,
                puedeAcceder: false,
                reason: "Debes aprobar el nivel " + (nivelNumero - 1),
            });
        }

        return res.json({ ok: true, puedeAcceder: true });

    } catch (error) {
        console.error("❌ Error puedeAccederNivel:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al verificar acceso",
        });
    }
};
