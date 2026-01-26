const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * Genera una constancia en PDF con identidad YES EMS y ÚNICAMENTE Marca de Agua central
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

            // Marco Exterior (Azul Profundo)
            doc.rect(20, 20, width - 40, height - 40)
                .lineWidth(3)
                .strokeColor("#00003f")
                .stroke();

            // Marco Interior Decorativo (Amarillo Ámbar)
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
                doc.opacity(0.1); // Transparencia sutil para que no tape el texto

                const logoWidth = 450; // Aumentamos un poco el tamaño para compensar la ausencia del superior
                // Centramos vertical y horizontalmente
                doc.image(logoPath, (width / 2) - (logoWidth / 2), (height / 2) - (logoWidth / 2.5), {
                    width: logoWidth
                });

                doc.restore();
            }

            /* ============================
                CONTENIDO TEXTUAL
            ============================ */
            // Título (Ajustamos el margen superior ya que no hay logo arriba)
            doc.moveDown(5);
            doc.fillColor("#00003f")
                .font("Helvetica-Bold")
                .fontSize(40)
                .text("RECONOCIMIENTO", { align: "center", characterSpacing: 2 });

            doc.moveDown(0.5);
            doc.fontSize(14)
                .font("Helvetica")
                .fillColor("#666666")
                .text("OTORGADO POR YES EMS ACADEMY A:", { align: "center" });

            // Nombre del Estudiante
            doc.moveDown(1.5);
            doc.fillColor("#00003f")
                .font("Helvetica-Bold")
                .fontSize(44)
                .text(nombreUsuario.toUpperCase(), { align: "center" });

            // Línea decorativa bajo el nombre
            const lineY = doc.y + 8;
            doc.moveTo(width * 0.2, lineY)
                .lineTo(width * 0.8, lineY)
                .lineWidth(2)
                .strokeColor("#fcb424")
                .stroke();

            // Detalles del curso
            doc.moveDown(2.5);
            doc.fillColor("#666666")
                .font("Helvetica")
                .fontSize(16)
                .text("Por haber acreditado con éxito el programa educativo de:", { align: "center" });

            doc.moveDown(0.5);
            doc.fillColor("#00003f")
                .font("Helvetica-Bold")
                .fontSize(28)
                .text(`"${nombreCurso}"`, { align: "center" });

            // Fecha
            const fecha = new Date(fechaFinalizacion).toLocaleDateString("es-MX", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });

            doc.moveDown(2);
            doc.fillColor("#666666")
                .font("Helvetica")
                .fontSize(13)
                .text(`Completado el día ${fecha}`, { align: "center" });

            /* ============================
                FIRMAS Y SELLOS
            ============================ */
            const firmaY = height - 120;

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

            // Sello de Autenticidad
            const sealX = width - 120;
            const sealY = height - 120;

            doc.save();
            doc.opacity(0.8);
            doc.circle(sealX, sealY, 45)
                .lineWidth(2)
                .strokeColor("#fcb424")
                .stroke();

            doc.fontSize(8)
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