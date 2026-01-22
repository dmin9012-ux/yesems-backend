// Controllers/cursoController.js
const { db } = require("../services/firebase");
const {
    obtenerCursoPorId,
    obtenerTotalNivelesCurso,
    obtenerLeccionesCurso,
} = require("../services/firebaseCursos");

/* =====================================================
   🔹 OBTENER TODOS LOS CURSOS
   GET /api/cursos
===================================================== */
exports.getCursos = async(req, res) => {
    try {
        const cursosSnapshot = await db.collection("cursos").get();
        const cursos = [];
        cursosSnapshot.forEach(doc => {
            cursos.push({ id: doc.id, ...doc.data() });
        });

        res.json({ ok: true, cursos });
    } catch (error) {
        console.error("❌ Error getCursos:", error);
        res.status(500).json({ ok: false, message: "Error al obtener cursos" });
    }
};

/* =====================================================
   🔹 OBTENER UN CURSO POR ID
   GET /api/cursos/:id
===================================================== */
exports.getCursoById = async(req, res) => {
    try {
        const cursoId = req.params.id;
        const curso = await obtenerCursoPorId(cursoId);

        if (!curso)
            return res.status(404).json({ ok: false, message: "Curso no encontrado" });

        // 🔹 Agregar información extra opcional
        const totalNiveles = await obtenerTotalNivelesCurso(cursoId);
        const lecciones = await obtenerLeccionesCurso(cursoId);

        res.json({ ok: true, curso: { id: cursoId, ...curso, totalNiveles, lecciones } });
    } catch (error) {
        console.error("❌ Error getCursoById:", error);
        res.status(500).json({ ok: false, message: "Error al obtener curso" });
    }
};

/* =====================================================
   🔹 CREAR NUEVO CURSO
   POST /api/cursos
===================================================== */
exports.crearCurso = async(req, res) => {
    try {
        const { nombre, descripcion } = req.body;

        if (!nombre)
            return res.status(400).json({ ok: false, message: "El nombre del curso es obligatorio" });

        const nuevoCurso = {
            nombre,
            descripcion: descripcion || "",
            niveles: [], // iniciar sin niveles
            creadoEn: new Date(),
        };

        const cursoRef = await db.collection("cursos").add(nuevoCurso);

        res.status(201).json({
            ok: true,
            message: "Curso creado correctamente",
            curso: { id: cursoRef.id, ...nuevoCurso },
        });
    } catch (error) {
        console.error("❌ Error crearCurso:", error);
        res.status(500).json({ ok: false, message: "Error al crear curso" });
    }
};