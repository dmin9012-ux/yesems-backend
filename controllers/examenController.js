const ProgresoCurso = require("../models/ProgresoCurso");
const {
    obtenerPreguntasNivel,
    obtenerTotalNivelesCurso,
    obtenerLeccionesNivel,
} = require("../services/firebaseCursos");

/* =====================================================
   📘 OBTENER EXAMEN DE UN NIVEL
===================================================== */
exports.obtenerExamenNivel = async function(req, res) {
    try {
        const usuarioId = req.usuario.id;
        const cursoId = req.params.cursoId;
        const nivel = Number(req.params.nivel);

        if (!cursoId || isNaN(nivel) || nivel < 1) {
            return res.status(400).json({ ok: false, message: "cursoId y nivel válidos son obligatorios" });
        }

        const preguntasBase = await obtenerPreguntasNivel(cursoId, nivel, 10);
        if (!Array.isArray(preguntasBase) || preguntasBase.length === 0) {
            return res.status(404).json({ ok: false, message: "No hay preguntas disponibles para este nivel" });
        }

        let progreso = await ProgresoCurso.findOne({ usuario: usuarioId, cursoId });
        if (!progreso) {
            progreso = new ProgresoCurso({
                usuario: usuarioId,
                cursoId,
                leccionesCompletadas: [],
                nivelesAprobados: [],
                intentosExamen: [],
                completado: false
            });
        }

        if (progreso.nivelesAprobados.includes(nivel)) {
            return res.status(403).json({ ok: false, message: "Este nivel ya fue aprobado" });
        }

        // Buscar intento activo
        let intento = progreso.intentosExamen.slice().reverse().find(i => i.nivel === nivel && i.respuestas.length === 0);

        if (!intento) {
            intento = {
                nivel,
                preguntas: preguntasBase.map(p => ({
                    id: p.id,
                    pregunta: p.pregunta,
                    opciones: p.opciones,
                    correcta: p.correcta
                })),
                respuestas: [],
                aprobado: false,
                porcentaje: 0,
                fecha: new Date()
            };
            progreso.intentosExamen.push(intento);
            await progreso.save();
        }

        // Reordenar preguntas para mostrar (sin 'correcta')
        const preguntasFinal = intento.preguntas.map(({ id, pregunta, opciones }) => ({ id, pregunta, opciones })).sort(() => Math.random() - 0.5);

        return res.json({ ok: true, cursoId, nivel, preguntas: preguntasFinal });

    } catch (error) {
        console.error("❌ Error obtenerExamenNivel:", error);
        return res.status(500).json({ ok: false, message: "Error al obtener el examen" });
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
            return res.status(400).json({ ok: false, message: "Debes enviar las respuestas" });
        }

        const progreso = await ProgresoCurso.findOne({ usuario: usuarioId, cursoId });
        if (!progreso) return res.status(404).json({ ok: false, message: "Progreso no encontrado" });

        const leccionesNivel = await obtenerLeccionesNivel(cursoId, nivel);
        const completadas = progreso.leccionesCompletadas.filter(l => leccionesNivel.includes(l));
        if (completadas.length !== leccionesNivel.length) {
            return res.status(403).json({ ok: false, message: "Debes completar todas las lecciones del nivel antes del examen" });
        }

        let intento = progreso.intentosExamen.slice().reverse().find(i => i.nivel === nivel && i.respuestas.length === 0);
        if (!intento) return res.status(400).json({ ok: false, message: "No se encontró intento válido" });

        // Calcular porcentaje
        const correctas = respuestas.reduce((acc, r) =>
            acc + intento.preguntas.filter(p => p.id === r.preguntaId && p.correcta === r.respuesta).length, 0);
        const total = intento.preguntas.length;
        const porcentaje = Math.round((correctas / total) * 100);
        const aprobado = porcentaje >= 80;

        intento.respuestas = respuestas;
        intento.aprobado = aprobado;
        intento.porcentaje = porcentaje;

        let cursoFinalizado = false;
        let siguienteNivel = null;

        if (aprobado) {
            if (!progreso.nivelesAprobados.includes(nivel)) progreso.nivelesAprobados.push(nivel);
            const totalNiveles = await obtenerTotalNivelesCurso(cursoId);

            if (nivel === totalNiveles) {
                // Curso finalizado
                progreso.completado = true;
                progreso.fechaFinalizacion = new Date();
                cursoFinalizado = true;

                // 🔹 Generar constancia
                progreso.constanciaEmitida = true;
                progreso.constanciaUrl = `${process.env.FRONTEND_URL}/constancia/${usuarioId}/${cursoId}`;
            } else {
                siguienteNivel = nivel + 1;
            }
        }

        await progreso.save();

        return res.json({
            ok: true,
            aprobado,
            porcentaje,
            siguienteNivel,
            cursoFinalizado,
            mensaje: cursoFinalizado ? "🎓 Curso finalizado" : aprobado ? "🎉 Examen aprobado" : "❌ No alcanzaste el 80%",
        });

    } catch (error) {
        console.error("❌ Error enviarExamenNivel:", error);
        return res.status(500).json({ ok: false, message: "Error al validar examen" });
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

        if (!cursoId || isNaN(nivel) || nivel < 1) {
            return res.status(400).json({ ok: false, message: "cursoId y nivel válidos son obligatorios" });
        }

        const progreso = await ProgresoCurso.findOne({ usuario: usuarioId, cursoId });
        const puedeAcceder = !progreso ? nivel === 1 : nivel === 1 || progreso.nivelesAprobados.includes(nivel - 1);

        return res.json({ ok: true, puedeAcceder });

    } catch (error) {
        console.error("❌ Error puedeAccederNivel:", error);
        return res.status(500).json({ ok: false, message: "Error interno al verificar acceso" });
    }
};