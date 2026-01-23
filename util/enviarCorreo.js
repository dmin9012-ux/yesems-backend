// util/enviarCorreo.js
const sgMail = require("@sendgrid/mail");
const path = require("path");
const fs = require("fs");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/* ===============================
   📧 PLANTILLA HTML BASE
================================*/
const generarPlantillaHTML = (titulo, contenido) => `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${titulo}</title>
<style>
body { margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, Helvetica, sans-serif; }
.container { max-width:600px; margin:30px auto; background-color:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 6px 18px rgba(0,0,0,0.15); }
.header { background-color:#00003f; padding:30px; text-align:center; }
.header img { max-width:140px; margin-bottom:10px; }
.header h1 { color:#fcb424; margin:0; font-size:26px; letter-spacing:1px; }
.content { padding:35px; color:#1f2937; font-size:15px; line-height:1.7; }
.content h2 { color:#00003f; margin-top:0; }
.divider { height:4px; background-color:#fcb424; margin:20px 0; border-radius:2px; }
.code-box { background-color:#fcb424; color:#00003f; font-size:32px; font-weight:bold; letter-spacing:6px; text-align:center; padding:18px; border-radius:8px; margin:25px 0; }
.warning { font-size:13px; color:#6b7280; margin-top:20px; }
.footer { background-color:#00003f; padding:18px; text-align:center; font-size:12px; color:#e5e7eb; }
.footer strong { color:#fcb424; }
</style>
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

/* ===============================
   📤 FUNCIÓN ENVIAR CORREO
================================*/
const enviarCorreo = async(para, asunto, contenidoHTML) => {
    try {
        const logoPath = path.join(__dirname, "../assets/logo-yesems.png");
        const attachments = [];

        // Adjuntar logo si existe (convertido a Base64)
        if (fs.existsSync(logoPath)) {
            const logoBuffer = fs.readFileSync(logoPath);
            attachments.push({
                content: logoBuffer.toString("base64"),
                filename: "logo-yesems.png",
                type: "image/png",
                disposition: "inline",
                content_id: "logoYesems", // para cid en HTML
            });
        }

        const msg = {
            to: para,
            from: process.env.EMAIL_FROM, // Debe ser remitente verificado en SendGrid
            subject: asunto,
            text: `
YES EMS - ${asunto}

Has solicitado una acción relacionada con tu cuenta.
Sigue las instrucciones indicadas en este correo.

Si no realizaste esta solicitud, puedes ignorar este mensaje.
      `.trim(),
            html: generarPlantillaHTML(asunto, contenidoHTML),
            attachments,
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