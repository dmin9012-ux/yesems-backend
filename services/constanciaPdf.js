// constanciaPdf.js
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * Genera una constancia en PDF con identidad YES EMS
 */
function generarConstanciaPDF({ nombreUsuario, nombreCurso, fechaFinalizacion }) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: "A4",
                layout: "landscape", // 📄 Cambiamos a horizontal para que parezca un diploma real
                margins: { top: 0, bottom: 0, left: 0, right: 0 }, // Manejamos márgenes internos manualmente
            });

            const buffers = [];
            doc.on("data", buffers.push.bind(buffers));
            doc.on("end", () => resolve(Buffer.concat(buffers)));

            const width = doc.page.width;
            const height = doc.page.height;

            /* ============================
               DISEÑO DE FONDO Y MARCOS
            ============================ */
            // 1. Fondo sutil
            doc.rect(0, 0, width, height).fill("#FFFFFF");

            // 2. Marco Exterior (Azul Profundo)
            doc.rect(20, 20, width - 40, height - 40)
                .lineWidth(3)
                .strokeColor("#00003f")
                .stroke();

            // 3. Marco Interior Decorativo (Amarillo Ámbar)
            doc.rect(30, 30, width - 60, height - 60)
                .lineWidth(1)
                .strokeColor("#fcb424")
                .stroke();

            /* ============================
               LOGO YESems
            ============================ */
            const logoPath = path.resolve(process.cwd(), "assets/logo-yesems.png");
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, width / 2 - 50, 60, { width: 100 });
            }

            /* ============================
               CABECERA
            ============================ */
            doc.moveDown(8);
            doc.fillColor("#00003f")
                .font("Helvetica-Bold")
                .fontSize(35)
                .text("RECONOCIMIENTO", { align: "center", characterSpacing: 2 });

            doc.moveDown(0.2);
            doc.fontSize(14)
                .font("Helvetica")
                .fillColor("#666666")
                .text("OTORGADO POR YES EMS ACADEMY A:", { align: "center" });

            /* ============================
               NOMBRE DEL ESTUDIANTE
            ============================ */
            doc.moveDown(1.5);
            doc.fillColor("#00003f")
                .font("Helvetica-Bold")
                .fontSize(40)
                .text(nombreUsuario.toUpperCase(), { align: "center" });

            // Línea decorativa bajo el nombre
            doc.moveTo(width / 4, doc.y + 5)
                .lineTo((width / 4) * 3, doc.y + 5)
                .lineWidth(2)
                .strokeColor("#fcb424")
                .stroke();

            /* ============================
               DETALLES DEL CURSO
            ============================ */
            doc.moveDown(2);
            doc.fillColor("#666666")
                .font("Helvetica")
                .fontSize(16)
                .text("Por haber acreditado con éxito el programa educativo de:", { align: "center" });

            doc.moveDown(0.5);
            doc.fillColor("#00003f")
                .font("Helvetica-Bold")
                .fontSize(24)
                .text(`"${nombreCurso}"`, { align: "center" });

            /* ============================
               FECHA Y VALIDEZ
            ============================ */
            const fecha = new Date(fechaFinalizacion).toLocaleDateString("es-MX", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });

            doc.moveDown(2);
            doc.fillColor("#666666")
                .font("Helvetica")
                .fontSize(12)
                .text(`Completado el día ${fecha}`, { align: "center" });

            /* ============================
               FIRMAS Y SELLOS
            ============================ */
            const firmaY = height - 120;

            // Línea de firma
            doc.moveTo(width / 2 - 100, firmaY)
                .lineTo(width / 2 + 100, firmaY)
                .lineWidth(1)
                .strokeColor("#00003f")
                .stroke();

            doc.fontSize(12)
                .fillColor("#00003f")
                .font("Helvetica-Bold")
                .text("DIRECCIÓN ACADÉMICA", width / 2 - 100, firmaY + 10, {
                    width: 200,
                    align: "center"
                });

            // Sello decorativo lateral (opcional)
            doc.circle(width - 100, height - 100, 40)
                .lineWidth(2)
                .strokeColor("#fcb424")
                .stroke();

            doc.fontSize(8)
                .text("Sello de\nAutenticidad", width - 130, height - 105, { align: "center", width: 60 });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = { generarConstanciaPDF };