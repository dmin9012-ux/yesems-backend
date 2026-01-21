const Usuario = require("../models/Usuario");

module.exports = (req, res, next) => {
    if (!req.usuario || req.usuario.rol !== "admin") {
        return res.status(403).json({
            ok: false,
            message: "Acceso denegado: solo administradores"
        });
    }

    next();
};