// testcorreo.js
require("dotenv").config(); // Cargar variables de .env
const enviarCorreo = require("./util/enviarCorreo");

(async() => {
    const destinatario = "fortis203@gmail.com"; // tu correo de prueba
    const asunto = "Prueba de correo YES EMS";
    const contenido = `
        <p>Hola, este es un correo de prueba de <strong>YES EMS</strong>.</p>
        <p>Si ves este correo, la configuración funciona correctamente.</p>
        <div class="code-box">123456</div>
        <p class="warning">Este es un mensaje de prueba, no tomar acciones.</p>
    `;

    const resultado = await enviarCorreo(destinatario, asunto, contenido);

    console.log("Resultado:", resultado);
})();