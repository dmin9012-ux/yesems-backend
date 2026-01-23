const sgMail = require('@sendgrid/mail');
const path = require('path');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const generarPlantillaHTML = (titulo, contenido) => `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${titulo}</title>
<!-- aquí tu CSS como antes -->
</head>
<body>
<div class="container">
<div class="header">
<img src="cid:logoYesems" alt="YES EMS logo">
<h1>YES EMS</h1>
</div>
<div class="content">
<h2>${titulo}</h2>
<div class="divider"></div>
${contenido}
</div>
<div class="footer">
© ${new Date().getFullYear()} <strong>YES EMS</strong><br>
Este correo fue enviado automáticamente · No responder
</div>
</div>
</body>
</html>
`;

const enviarCorreo = async(para, asunto, contenidoHTML) => {
    try {
        const msg = {
            to: para,
            from: process.env.EMAIL_FROM,
            subject: asunto,
            html: generarPlantillaHTML(asunto, contenidoHTML),
        };

        await sgMail.send(msg);

        console.log("📧 Correo enviado correctamente a:", para);
        return true;
    } catch (error) {
        if (error.response && error.response.body) {
            console.error("❌ Error enviando correo con SendGrid:", error.response.body);
        } else {
            console.error("❌ Error enviando correo con SendGrid:", error);
        }
        return false;
    }
};

module.exports = enviarCorreo;