const ProgresoCurso = require("../models/ProgresoCurso");
const {
    obtenerPreguntasNivel,
    obtenerTotalNivelesCurso,
    obtenerCursoPorId,
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
            progreso = new ProgresoCurso({ usuario: usuarioId, cursoId });
            await progreso.save();
        }

        // 🔒 Nivel bloqueado
        if (!progreso.nivelesDesbloqueados.includes(nivelNumero)) {
            return res.status(403).json({
                ok: false,
                message: "Este nivel aún no está desbloqueado",
            });
        }

        // ❌ Nivel ya aprobado
        if (progreso.nivelesAprobados.includes(nivelNumero)) {
            return res.status(403).json({
                ok: false,
                message: "Este nivel ya fue aprobado",
            });
        }

        // 🔒 Todas las lecciones completadas
        if (!progreso.nivelesConLeccionesCompletas.includes(nivelNumero)) {
            return res.status(403).json({
                ok: false,
                message: "Debes completar todas las lecciones antes de presentar el examen",
            });
        }

        // 🔁 Intento pendiente
        const intentosReverso = progreso.intentosExamen.slice().reverse();
        let intentoPendiente = null;
        for (let i = 0; i < intentosReverso.length; i++) {
            const intento = intentosReverso[i];
            if (intento.nivel === nivelNumero && Array.isArray(intento.respuestas) && intento.respuestas.length === 0) {
                intentoPendiente = intento;
                break;
            }
        }

        if (intentoPendiente) {
            return res.json({
                ok: true,
                cursoId,
                nivel: nivelNumero,
                preguntas: intentoPendiente.preguntas.map(function(p) {
                    return {
                        id: p.id,
                        pregunta: p.pregunta,
                        opciones: p.opciones,
                    };
                }),
            });
        }

        // 🔍 Obtener preguntas
        const preguntasBase = await obtenerPreguntasNivel(cursoId, nivelNumero, 10);
        if (!Array.isArray(preguntasBase) || preguntasBase.length === 0) {
            return res.status(404).json({
                ok: false,
                message: "No hay preguntas disponibles para este nivel",
            });
        }

        const intento = {
            nivel: nivelNumero,
            preguntas: preguntasBase.map(function(p) {
                return {
                    id: p.id,
                    pregunta: p.pregunta,
                    opciones: p.opciones,
                    correcta: p.correcta,
                };
            }),
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
            preguntas: intento.preguntas.map(function(p) {
                return {
                    id: p.id,
                    pregunta: p.pregunta,
                    opciones: p.opciones,
                };
            }),
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
        const respuestas = Array.isArray(req.body.respuestas) ? req.body.respuestas : [];

        const progreso = await ProgresoCurso.findOne({ usuario: usuarioId, cursoId });
        if (!progreso) {
            return res.status(404).json({
                ok: false,
                message: "Progreso no encontrado",
            });
        }

        if (progreso.nivelesAprobados.indexOf(nivelNumero) !== -1) {
            return res.status(403).json({
                ok: false,
                message: "Este nivel ya fue aprobado",
            });
        }

        // Buscar último intento pendiente
        const intentosReverso = progreso.intentosExamen.slice().reverse();
        let intento = null;
        for (let i = 0; i < intentosReverso.length; i++) {
            if (intentosReverso[i].nivel === nivelNumero && Array.isArray(intentosReverso[i].respuestas) && intentosReverso[i].respuestas.length === 0) {
                intento = intentosReverso[i];
                break;
            }
        }

        if (!intento) {
            return res.status(400).json({
                ok: false,
                message: "Intento de examen no encontrado",
            });
        }

        // ✅ Calcular respuestas correctas
        let correctas = 0;
        for (let i = 0; i < respuestas.length; i++) {
            const r = respuestas[i];
            const p = intento.preguntas.find(function(q) { return q.id === r.preguntaId; });
            if (p && p.correcta === r.respuesta) {
                correctas++;
            }
        }

        const porcentaje = Math.round((correctas / intento.preguntas.length) * 100);

        // 🔍 Obtener mínimo de aprobación
        let minimoAprobacion = 80;
        const curso = await obtenerCursoPorId(cursoId);
        if (curso && Array.isArray(curso.niveles)) {
            for (let i = 0; i < curso.niveles.length; i++) {
                const n = curso.niveles[i];
                if (n.numero === nivelNumero && n.examen && typeof n.examen.minimoAprobacion === "number") {
                    minimoAprobacion = n.examen.minimoAprobacion;
                    break;
                }
            }
        }

        const aprobado = porcentaje >= minimoAprobacion;

        intento.respuestas = respuestas;
        intento.aprobado = aprobado;
        intento.porcentaje = porcentaje;

        if (aprobado && progreso.nivelesAprobados.indexOf(nivelNumero) === -1) {
            progreso.nivelesAprobados.push(nivelNumero);

            const totalNiveles = await obtenerTotalNivelesCurso(cursoId);
            const siguienteNivel = nivelNumero + 1;

            if (siguienteNivel <= totalNiveles && progreso.nivelesDesbloqueados.indexOf(siguienteNivel) === -1) {
                progreso.nivelesDesbloqueados.push(siguienteNivel);
            }
        }

        await progreso.save();

        return res.json({
            ok: true,
            aprobado: aprobado,
            porcentaje: porcentaje,
            minimoAprobacion: minimoAprobacion,
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

        let puede = false;
        if (!progreso) {
            puede = nivelNumero === 1;
        } else {
            puede = progreso.nivelesDesbloqueados.indexOf(nivelNumero) !== -1;
        }

        return res.json({
            ok: true,
            puedeAcceder: puede,
        });
    } catch (error) {
        console.error("❌ Error puedeAccederNivel:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al verificar acceso",
        });
    }
};