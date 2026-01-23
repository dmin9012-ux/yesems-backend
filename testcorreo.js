const enviarCorreo = require("./util/enviarCorreo");

(async() => {
    const ok = await enviarCorreo(
        "fortis203@gmail.com",
        "Prueba SendGrid",
        "<p>Este es un correo de prueba</p>"
    );
    console.log("Resultado:", ok);
})();