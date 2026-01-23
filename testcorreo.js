require("dotenv").config();
const enviarCorreo = require("./util/enviarCorreo");

(async() => {
    const resultado = await enviarCorreo(
        "fortis203@gmail.com",
        "Prueba de correo Neubox",
        "<p>Este es un correo de prueba desde tu dominio</p>"
    );
    console.log("Resultado:", resultado);
})();