const express = require('express');
const { getCursos, getCursoById, crearCurso } = require('../Controllers/CursoController');
const router = express.Router();

router.get('/', getCursos);
router.get('/:id', getCursoById);
router.post('/', crearCurso);

module.exports = router;