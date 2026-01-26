const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * Genera una constancia con el nombre de la institución en formato "escalera"
 * Asegurando que la fecha y firma queden dentro de los márgenes decorativos.
 */
function generarConstanciaPDF({ nombreUsuario, nombreCurso, fechaFinalizacion }) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: "A4",
                layout: "landscape",
                margins: { top: 0, bottom: 0, left: 0, right: 0 },
            });

            const buffers = [];
            doc.on("data", buffers.push.bind(buffers));
            doc.on("end", () => resolve(Buffer.concat(buffers)));

            const width = doc.page.width;
            const height = doc.page.height;

            /* ============================
                DISEÑO DE FONDO Y MARCOS
            ============================ */
            doc.rect(0, 0, width, height).fill("#FFFFFF");

            // Marco Exterior
            doc.rect(20, 20, width - 40, height - 40)
                .lineWidth(3)
                .strokeColor("#00003f")
                .stroke();

            // Marco Interior (Límite visual para el contenido)
            doc.rect(30, 30, width - 60, height - 60)
                .lineWidth(1)
                .strokeColor("#fcb424")
                .stroke();

            /* ============================
                MARCA DE AGUA (CENTRO)
            ============================ */
            const logoPath = path.resolve(process.cwd(), "assets/logo-yesems.png");

            if (fs.existsSync(logoPath)) {
                doc.save();
                doc.opacity(0.1);
                const logoWidth = 450;
                doc.image(logoPath, (width / 2) - (logoWidth / 2), (height / 2) - (logoWidth / 2.5), {
                    width: logoWidth
                });
                doc.restore();
            }

            /* ============================
                CONTENIDO TEXTUAL
            ============================ */
            doc.moveDown(4.5); // Subimos un poco el inicio
            doc.fillColor("#00003f")
                .font("Helvetica-Bold")
                .fontSize(38)
                .text("RECONOCIMIENTO", { align: "center", characterSpacing: 2 });

            doc.moveDown(0.6);
            doc.fontSize(14)
                .font("Helvetica")
                .fillColor("#666666")
                .text("OTORGADO POR EL", { align: "center" });

            doc.fontSize(16)
                .font("Helvetica-Bold")
                .fillColor("#00003f")
                .text("CENTRO DE CAPACITACIÓN Y SERVICIOS EDUCATIVOS", { align: "center" });

            doc.fontSize(22)
                .text("YES EMS", { align: "center" });

            doc.moveDown(0.3);
            doc.fontSize(14)
                .font("Helvetica")
                .fillColor("#666666")
                .text("A:", { align: "center" });

            /* ============================
                NOMBRE DEL ESTUDIANTE
            ============================ */
            doc.moveDown(1.2);
            doc.fillColor("#00003f")
                .font("Helvetica-Bold")
                .fontSize(42)
                .text(nombreUsuario.toUpperCase(), { align: "center" });

            const lineY = doc.y + 8;
            doc.moveTo(width * 0.2, lineY)
                .lineTo(width * 0.8, lineY)
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
                .fontSize(26)
                .text(`"${nombreCurso}"`, { align: "center" });

            /* ============================
                FECHA (DENTRO DE MARGEN)
            ============================ */
            const fecha = new Date(fechaFinalizacion).toLocaleDateString("es-MX", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });

            doc.moveDown(2.5); // Ajustado para que no empuje la firma fuera
            doc.fillColor("#666666")
                .font("Helvetica")
                .fontSize(12)
                .text(`Completado el día ${fecha}`, { align: "center" });

            /* ============================
                FIRMAS Y SELLOS (DENTRO DE MARGEN)
            ============================ */
            const firmaY = height - 130; // Subimos la firma (antes 100) para asegurar margen

            doc.moveTo(width / 2 - 100, firmaY)
                .lineTo(width / 2 + 100, firmaY)
                .lineWidth(1)
                .strokeColor("#00003f")
                .stroke();

            doc.fontSize(11)
                .fillColor("#00003f")
                .font("Helvetica-Bold")
                .text("YES EMS", width / 2 - 120, firmaY + 10, {
                    width: 240,
                    align: "center"
                });

            // Sello de Autenticidad
            const sealX = width - 130; // Movido un poco a la izquierda
            const sealY = height - 130; // Subido para estar dentro del margen

            doc.save();
            doc.opacity(0.8);
            doc.circle(sealX, sealY, 40)
                .lineWidth(2)
                .strokeColor("#fcb424")
                .stroke();

            doc.fontSize(7)
                .fillColor("#fcb424")
                .font("Helvetica-Bold")
                .text("YES EMS\nVERIFIED", sealX - 30, sealY - 10, { align: "center", width: 60 });
            doc.restore();

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = { generarConstanciaPDF };