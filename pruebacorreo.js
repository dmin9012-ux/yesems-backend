require("dotenv").config(); // para cargar las variables de entorno
const enviarCorreo = require("./utils/enviarCorreo"); // ruta correcta a tu enviarCorreo.js

(async() => {
    const enviado = await enviarCorreo(
        "fortisfernando7@gmail.com", // <-- tu correo de prueba
        "Prueba de recuperación",
        "<p>Esto es un correo de prueba de YESems</p>"
    );

    console.log("Correo enviado:", enviado);
})();