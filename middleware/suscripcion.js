const Usuario = require("../models/Usuario");

module.exports = async(req, res, next) => {
    try {
        const usuarioId = req.usuario.id;
        const usuario = await Usuario.findById(usuarioId);

        if (!usuario) {
            return res.status(401).json({
                ok: false,
                message: "Usuario no encontrado",
            });
        }

        // Permitir el paso libre si el usuario es administrador
        if (usuario.rol === "admin") {
            return next();
        }

        // Verificar si existe el objeto suscripcion y si está activa
        if (!usuario.suscripcion || usuario.suscripcion.activa !== true) {
            return res.status(403).json({
                ok: false,
                message: "No tienes una suscripción activa",
            });
        }

        const ahora = new Date();
        const fechaFin = new Date(usuario.suscripcion.fechaFin);

        // Verificar si la fecha actual superó la fecha de vencimiento
        if (ahora > fechaFin) {
            // Actualización automática en la base de datos si ya expiró
            usuario.suscripcion.activa = false;
            await usuario.save();

            return res.status(403).json({
                ok: false,
                message: "Tu suscripción ha expirado",
            });
        }

        // Si todo está correcto, permite el acceso al controlador
        next();

    } catch (error) {
        console.error("❌ Error middleware suscripción:", error.message);
        return res.status(500).json({
            ok: false,
            message: "Error validando suscripción",
        });
    }
};