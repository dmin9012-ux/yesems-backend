const Usuario = require("../models/Usuario");

module.exports = async(req, res, next) => {
    try {
        const usuarioId = req.usuario.id;
        const usuario = await Usuario.findById(usuarioId);

        if (!usuario) {
            return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
        }

        if (usuario.rol === "admin") return next();

        // ✅ CORRECCIÓN: Buscamos "active" en el campo "estado"
        if (!usuario.suscripcion || usuario.suscripcion.estado !== "active") {
            return res.status(403).json({
                ok: false,
                message: "Acceso denegado. Requiere suscripción activa.",
                requireSubscription: true
            });
        }

        const ahora = new Date();
        const fechaFin = new Date(usuario.suscripcion.fechaFin);

        if (ahora > fechaFin) {
            // ✅ CORRECCIÓN: Cambiamos el estado a "expired"
            usuario.suscripcion.estado = "expired";
            await usuario.save();

            return res.status(403).json({
                ok: false,
                message: "Tu suscripción ha expirado.",
                requireSubscription: true
            });
        }

        next();
    } catch (error) {
        console.error("❌ Error en middleware checkSuscripcion:", error.message);
        return res.status(500).json({ ok: false, message: "Error al verificar suscripción" });
    }
};