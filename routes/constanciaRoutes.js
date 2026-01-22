// constanciaRoutes.js
const express = require("express");
const router = express.Router();
const { generarConstancia } = require("../controllers/constanciaController");
const auth = require("../middleware/auth");

// 🔹 Generar constancia de un curso
router.get("/:cursoId", auth, generarConstancia);

module.exports = router;