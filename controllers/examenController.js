const ProgresoCurso = require("../models/ProgresoCurso");
const {
    obtenerPreguntasNivel,
    obtenerTotalNivelesCurso,
    obtenerLeccionesNivel,
    obtenerLeccionesCurso,
    obtenerCursoPorId,
} = require("../services/firebaseCursos");

/* =====================================================
   📘 OBTENER EXAMEN DE UN NIVEL
===================================================== */
exports.obtenerExamenNivel = async(req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { cursoId, nivel } = req.params;
        const nivelNumero = Number(nivel);

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
            });
        }

        if (progreso.nivelesAprobados.includes(nivelNumero)) {
            return res.status(403).json({
                ok: false,
                message: "Este nivel ya fue aprobado",
            });
        }

        // 🔒 Evitar múltiples intentos abiertos
        const intentoPendiente = progreso.intentosExamen.find(
            (i) => i.nivel === nivelNumero && i.respuestas.length === 0
        );

        if (intentoPendiente) {
            return res.json({
                ok: true,
                cursoId,
                nivel: nivelNumero,
                preguntas: intentoPendiente.preguntas.map((p) => ({
                    id: p.id,
                    pregunta: p.pregunta,
                    opciones: p.opciones,
                })),
            });
        }

        const preguntasBase = await obtenerPreguntasNivel(cursoId, nivelNumero, 10);

        if (!Array.isArray(preguntasBase) || preguntasBase.length === 0) {
            return res.status(404).json({
                ok: false,
                message: "No hay preguntas disponibles para este nivel",
            });
        }

        const intento = {
            nivel: nivelNumero,
            preguntas: preguntasBase.map((p) => ({
                id: p.id,
                pregunta: p.pregunta,
                opciones: p.opciones,
            })),
            respuestas: [],
            aprobado: false,
            porcentaje: 0,
            fecha: new Date(),
        };

        progreso.intentosExamen.push(intento);
        await progreso.save();

        return res.json({
            ok: true,
            cursoId,
            nivel: nivelNumero,
            preguntas: intento.preguntas,
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
        const { cursoId, nivel } = req.params;
        const nivelNumero = Number(nivel);
        const { respuestas } = req.body;

        const progreso = await ProgresoCurso.findOne({ usuario: usuarioId, cursoId });
        if (!progreso) {
            return res.status(404).json({
                ok: false,
                message: "Progreso no encontrado",
            });
        }

        if (progreso.nivelesAprobados.includes(nivelNumero)) {
            return res.status(403).json({
                ok: false,
                message: "Este nivel ya fue aprobado",
            });
        }

        const leccionesNivel = await obtenerLeccionesNivel(cursoId, nivelNumero);

        const completadas = leccionesNivel.filter((l) =>
            progreso.leccionesCompletadas.includes(l)
        );

        if (completadas.length !== leccionesNivel.length) {
            return res.status(403).json({
                ok: false,
                message: "Completa todas las lecciones antes del examen",
            });
        }

        const intento = [...progreso.intentosExamen]
            .reverse()
            .find((i) => i.nivel === nivelNumero && i.respuestas.length === 0);

        if (!intento) {
            return res.status(400).json({
                ok: false,
                message: "Intento de examen no encontrado",
            });
        }

        const preguntasCorrectas = await obtenerPreguntasNivel(
            cursoId,
            nivelNumero,
            intento.preguntas.length
        );

        let correctas = 0;
        for (let i = 0; i < respuestas.length; i++) {
            const r = respuestas[i];
            const p = preguntasCorrectas.find((q) => q.id === r.preguntaId);
            if (p && p.correcta === r.respuesta) correctas++;
        }

        const porcentaje = Math.round(
            (correctas / intento.preguntas.length) * 100
        );

        const curso = await obtenerCursoPorId(cursoId);
        let minimoAprobacion = 80;

        if (curso && Array.isArray(curso.niveles)) {
            const nivelCurso = curso.niveles.find(
                (n) => Number(n.numero) === nivelNumero
            );
            if (
                nivelCurso &&
                nivelCurso.examen &&
                typeof nivelCurso.examen.minimoAprobacion === "number"
            ) {
                minimoAprobacion = nivelCurso.examen.minimoAprobacion;
            }
        }

        const aprobado = porcentaje >= minimoAprobacion;

        intento.respuestas = respuestas;
        intento.aprobado = aprobado;
        intento.porcentaje = porcentaje;

        let siguienteNivel = null;
        let cursoFinalizado = false;

        if (aprobado) {
            progreso.nivelesAprobados = Array.from(
                new Set([...progreso.nivelesAprobados, nivelNumero])
            ).sort((a, b) => a - b);

            const totalNiveles = await obtenerTotalNivelesCurso(cursoId);
            const totalLecciones = await obtenerLeccionesCurso(cursoId);

            if (
                progreso.nivelesAprobados.length === totalNiveles &&
                progreso.leccionesCompletadas.length === totalLecciones.length
            ) {
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
            minimoAprobacion,
            siguienteNivel,
            cursoFinalizado,
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
        const { cursoId, nivel } = req.params;
        const nivelNumero = Number(nivel);

        if (nivelNumero === 1) {
            return res.json({ ok: true, puedeAcceder: true });
        }

        const progreso = await ProgresoCurso.findOne({ usuario: usuarioId, cursoId });

        if (!progreso || !progreso.nivelesAprobados.includes(nivelNumero - 1)) {
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