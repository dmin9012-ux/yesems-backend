require('dotenv').config();
const enviarCorreo = require('./util/enviarCorreo');

const probarCorreo = async() => {
    const destinatario = 'fortis203@gmail.com'; //correo para pruebas
    const asunto = 'Prueba de correo YES EMS';
    const contenido = `<p>Este es un correo de prueba enviado desde YES EMS en Railway con SendGrid.</p>`;

    const resultado = await enviarCorreo(destinatario, asunto, contenido);

    console.log('Resultado:', resultado);
};

probarCorreo();