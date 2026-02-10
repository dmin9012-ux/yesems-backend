const Usuario = require("../models/Usuario");

module.exports = async(req, res, next) => {
    try {
        // req.usuario.id debe venir del middleware de auth previo
        const usuarioId = req.usuario.id;
        const usuario = await Usuario.findById(usuarioId);

        if (!usuario) {
            return res.status(404).json({
                ok: false,
                message: "Usuario no encontrado"
            });
        }

        // 1. Si es administrador, tiene acceso total sin importar la suscripción
        if (usuario.rol === "admin") {
            return next();
        }

        // 2. Verificar si el objeto suscripcion existe y si está marcada como activa
        if (!usuario.suscripcion || !usuario.suscripcion.activa) {
            return res.status(403).json({
                ok: false,
                message: "Acceso denegado. Requiere suscripción activa.",
                requireSubscription: true
            });
        }

        // 3. Validación de tiempo (Seguridad extra por si no ha corrido el proceso de limpieza)
        const ahora = new Date();
        const fechaFin = new Date(usuario.suscripcion.fechaFin);

        if (ahora > fechaFin) {
            // Desactivamos la suscripción si ya pasó el tiempo límite
            usuario.suscripcion.activa = false;
            await usuario.save();

            return res.status(403).json({
                ok: false,
                message: "Tu suscripción ha expirado.",
                requireSubscription: true
            });
        }

        // Si pasa todas las pruebas, continúa al siguiente proceso
        next();

    } catch (error) {
        console.error("❌ Error en middleware checkSuscripcion:", error.message);
        return res.status(500).json({
            ok: false,
            message: "Error al verificar suscripción"
        });
    }
};