const generarPreguntasNivel = (nivel) => {
    const preguntas = [];

    // 1️⃣ Preguntas por título del nivel
    preguntas.push({
        pregunta: `¿Cuál es el objetivo principal del nivel "${nivel.titulo}"?`,
        opciones: [
            "Aprender conceptos básicos",
            "Aprender temas avanzados",
            "Solo teoría",
            "No tiene objetivo"
        ],
        correcta: 0,
    });

    // 2️⃣ Preguntas por lecciones
    nivel.lecciones.forEach((leccion, index) => {
        preguntas.push({
            pregunta: `¿Cuál es el tema principal de la lección "${leccion.titulo}"?`,
            opciones: [
                leccion.titulo,
                "Variables",
                "Funciones",
                "Clases"
            ],
            correcta: 0,
        });
    });

    // 3️⃣ Rellenar hasta 20 preguntas mínimo
    while (preguntas.length < 20) {
        preguntas.push({
            pregunta: "¿Cuál es una característica de C++?",
            opciones: [
                "Lenguaje interpretado",
                "Lenguaje compilado",
                "Lenguaje de marcado",
                "Lenguaje visual"
            ],
            correcta: 1,
        });
    }

    // 4️⃣ Agregar ID único
    return preguntas.map((p, i) => ({
        id: `p${i + 1}`,
        ...p,
    }));
};

module.exports = {
    generarPreguntasNivel,
};