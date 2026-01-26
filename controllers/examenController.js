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
exports.obtenerExamenNivel = async(req, res) => {
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
        const completadas = leccionesNivel.filter(l => progreso.leccionesCompletadas.includes(l));

        if (completadas.length !== leccionesNivel.length) {
            return res.status(403).json({
                ok: false,
                message: "Debes completar todas las lecciones antes del examen",
            });
        }

        // Intento pendiente
        let intentoPendiente = progreso.intentosExamen.find(i => i.nivel === nivelNumero && i.estado === "pendiente");

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

        const preguntasIntento = preguntasBase.map(p => ({
            id: p.id,
            pregunta: p.pregunta,
            opciones: p.opciones,
            correcta: p.correcta,
        }));

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
exports.enviarExamenNivel = async(req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const cursoId = req.params.cursoId;
        const nivelNumero = Number(req.params.nivel);
        const respuestas = req.body.respuestas;

        const progreso = await ProgresoCurso.findOne({ usuario: usuarioId, cursoId });
        if (!progreso) return res.status(404).json({ ok: false, message: "Progreso no encontrado" });

        if (progreso.nivelesAprobados.includes(nivelNumero)) {
            return res.status(403).json({ ok: false, message: "Este nivel ya fue aprobado" });
        }

        // Buscamos el índice directamente para asegurar la mutación correcta en Mongoose
        const intentoIndex = progreso.intentosExamen.findIndex(
            i => i.nivel === nivelNumero && i.estado === "pendiente"
        );

        if (intentoIndex === -1) {
            return res.status(400).json({ ok: false, message: "Intento de examen no encontrado o ya evaluado" });
        }

        const intento = progreso.intentosExamen[intentoIndex];

        // Calcular respuestas correctas
        let correctas = 0;
        respuestas.forEach(r => {
            const p = intento.preguntas.find(pre => pre.id === r.preguntaId);
            if (p && p.correcta === r.respuesta) correctas++;
        });

        const porcentaje = Math.round((correctas / intento.preguntas.length) * 100);
        const aprobado = porcentaje >= 80;

        // Actualizamos los datos del intento
        intento.respuestas = respuestas;
        intento.aprobado = aprobado;
        intento.porcentaje = porcentaje;
        intento.estado = "finalizado";

        // IMPORTANTE: Notificar a Mongoose que el array de objetos cambió
        progreso.markModified('intentosExamen');

        let siguienteNivel = null;
        let cursoFinalizado = false;

        if (aprobado) {
            if (!progreso.nivelesAprobados.includes(nivelNumero)) {
                progreso.nivelesAprobados.push(nivelNumero);
                progreso.markModified('nivelesAprobados'); // Forzar detección de cambio
            }

            progreso.nivelesAprobados.sort((a, b) => a - b);

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
            aprobado,
            porcentaje,
            siguienteNivel,
            cursoFinalizado,
            // Enviamos el objeto progreso completo para sincronizar el frontend correctamente
            progresoActualizado: progreso,
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
exports.puedeAccederNivel = async(req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const cursoId = req.params.cursoId;
        const nivelNumero = Number(req.params.nivel);

        const progreso = await ProgresoCurso.findOne({ usuario: usuarioId, cursoId });

        if (!progreso) {
            return res.json({ ok: true, puedeAcceder: nivelNumero === 1 });
        }

        if (progreso.completado) return res.json({ ok: true, puedeAcceder: true }); // Permitir repaso
        if (nivelNumero === 1) return res.json({ ok: true, puedeAcceder: true });

        const anteriorAprobado = progreso.nivelesAprobados.includes(nivelNumero - 1);
        if (!anteriorAprobado) {
            return res.json({
                ok: true,
                puedeAcceder: false,
                reason: `Debes aprobar el nivel ${nivelNumero - 1}`,
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