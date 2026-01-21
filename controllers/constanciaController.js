const ProgresoCurso = require("../models/ProgresoCurso");
const Usuario = require("../models/Usuario");
const { generarConstanciaPDF } = require("../services/constanciaPdf");
const { obtenerCursoPorId } = require("../services/firebaseCursos");

/* =========================================
   🎓 GENERAR CONSTANCIA PDF
   GET /api/constancia/:cursoId
========================================= */
const generarConstancia = async(req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { cursoId } = req.params;

        // 🔐 Verificar que el curso esté completado
        const progreso = await ProgresoCurso.findOne({
            usuario: usuarioId,
            cursoId,
            completado: true,
        });

        if (!progreso) {
            return res.status(403).json({
                ok: false,
                message: "El curso no está finalizado",
            });
        }

        // 👤 Obtener usuario
        const usuario = await Usuario.findById(usuarioId).select("nombre");

        if (!usuario) {
            return res.status(404).json({
                ok: false,
                message: "Usuario no encontrado",
            });
        }

        // 📘 Obtener curso desde Firebase
        const curso = await obtenerCursoPorId(cursoId);

        if (!curso) {
            return res.status(404).json({
                ok: false,
                message: "Curso no encontrado",
            });
        }

        // 🧾 Generar PDF
        const pdfBuffer = await generarConstanciaPDF({
            nombreUsuario: usuario.nombre,
            nombreCurso: curso.nombre,
            fechaFinalizacion: progreso.fechaFinalizacion || new Date(),
        });

        const nombreArchivo = `Constancia-${curso.nombre
            .replace(/[^a-zA-Z0-9]/g, "_")
            .toLowerCase()}.pdf`;

        // 📤 Enviar PDF al frontend
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${nombreArchivo}"`
        );

        return res.send(pdfBuffer);
    } catch (error) {
        console.error("❌ Error generar constancia:", error);
        return res.status(500).json({
            ok: false,
            message: "Error al generar la constancia",
        });
    }
};

module.exports = {
    generarConstancia,
};