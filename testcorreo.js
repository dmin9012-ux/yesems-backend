require('dotenv').config(); // carga variables de Railway si corres local
const enviarCorreo = require('./util/enviarCorreo');

(async() => {
    const resultado = await enviarCorreo(
        'tu_correo_de_prueba@gmail.com', // tu correo real para recibir el test
        'Prueba de correo Railway',
        '<p>Este es un correo de prueba desde Railway usando Gmail y nodemailer.</p>'
    );

    console.log('Resultado:', resultado);
})();