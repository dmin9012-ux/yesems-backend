const nodemailer = require("nodemailer");
const path = require("path");

const generarPlantillaHTML = (titulo, contenido) => `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${titulo}</title>
<style>
body { margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, Helvetica, sans-serif; }
.container { max-width:600px; margin:30px auto; background-color:#fff; border-radius:10px; overflow:hidden; box-shadow:0 6px 18px rgba(0,0,0,0.15);}
.header { background-color:#00003f; padding:30px; text-align:center; }
.header img { max-width:140px; margin-bottom:10px; }
.header h1 { color:#fcb424; margin:0; font-size:26px; letter-spacing:1px; }
.content { padding:35px; color:#1f2937; font-size:15px; line-height:1.7; }
.content h2 { color:#00003f; margin-top:0; }
.divider { height:4px; background-color:#fcb424; margin:20px 0; border-radius:2px; }
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

const enviarCorreo = async(para, asunto, contenidoHTML) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const htmlFinal = generarPlantillaHTML(asunto, contenidoHTML);

        await transporter.sendMail({
            from: `"YES EMS | Soporte" <${process.env.EMAIL_USER}>`,
            to: para,
            subject: asunto,
            text: `YES EMS - ${asunto}\n\nSigue las instrucciones indicadas.\nSi no solicitaste esto, ignora este mensaje.`,
            html: htmlFinal,
            attachments: [{
                filename: "logo-yesems.png",
                path: path.join(__dirname, "../assets/logo-yesems.png"),
                cid: "logoYesems"
            }]
        });

        console.log("📧 Correo enviado correctamente a:", para);
        return true;

    } catch (error) {
        console.error("❌ Error enviando correo con Neubox:", error);
        return false;
    }
};

module.exports = enviarCorreo;