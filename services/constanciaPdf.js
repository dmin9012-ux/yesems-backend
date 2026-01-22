// constanciaPdf.js
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * Genera una constancia en PDF moderna
 * @param {Object} param0
 * @param {string} param0.nombreUsuario
 * @param {string} param0.nombreCurso
 * @param {Date|string} param0.fechaFinalizacion
 * @returns {Promise<Buffer>} PDF en buffer
 */
function generarConstanciaPDF({ nombreUsuario, nombreCurso, fechaFinalizacion }) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: "A4",
                margins: { top: 50, bottom: 60, left: 50, right: 50 },
            });

            const buffers = [];
            doc.on("data", buffers.push.bind(buffers));
            doc.on("end", () => resolve(Buffer.concat(buffers)));

            /* ============================
               LOGO YESems
            ============================ */
            const logoPath = path.resolve(process.cwd(), "assets/logo-yesems.png");

            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, doc.page.width / 2 - 60, 40, {
                    width: 120,
                });
            }

            doc.moveDown(6);

            /* ============================
               TÍTULO
            ============================ */
            doc
                .font("Helvetica-Bold")
                .fontSize(28)
                .fillColor("#1F4ED8")
                .text("CONSTANCIA DE FINALIZACIÓN", { align: "center" });

            doc.moveDown(0.8);

            doc
                .moveTo(150, doc.y)
                .lineTo(doc.page.width - 150, doc.y)
                .lineWidth(2)
                .strokeColor("#1F4ED8")
                .stroke();

            doc.moveDown(2.5);

            /* ============================
               TEXTO
            ============================ */
            doc
                .fontSize(14)
                .fillColor("#000")
                .font("Helvetica")
                .text("Por medio de la presente se hace constar que:", { align: "center" });

            doc.moveDown(2);

            /* ============================
               NOMBRE (DESTACADO)
            ============================ */
            doc
                .roundedRect(120, doc.y, doc.page.width - 240, 50, 10)
                .fill("#F3F6FF");

            doc
                .fillColor("#2C3E50")
                .font("Helvetica-Bold")
                .fontSize(22)
                .text(nombreUsuario, 0, doc.y + 15, { align: "center" });

            doc.moveDown(3);

            /* ============================
               CURSO
            ============================ */
            doc
                .fontSize(14)
                .font("Helvetica")
                .fillColor("#000")
                .text("ha completado satisfactoriamente el curso:", { align: "center" });

            doc.moveDown(1);

            doc
                .fontSize(20)
                .font("Helvetica-Bold")
                .fillColor("#1F4ED8")
                .text(nombreCurso, { align: "center" });

            doc.moveDown(2);

            /* ============================
               FECHA
            ============================ */
            const fecha = new Date(fechaFinalizacion).toLocaleDateString("es-MX", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });

            doc
                .fontSize(12)
                .fillColor("#000")
                .font("Helvetica")
                .text(`Fecha de finalización: ${fecha}`, { align: "center" });

            doc.moveDown(5);

            /* ============================
               FIRMA
            ============================ */
            doc
                .fontSize(12)
                .fillColor("#000")
                .text("______________________________", { align: "center" })
                .moveDown(0.5)
                .text("YESems Plataforma Educativa", { align: "center" });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    generarConstanciaPDF,
};