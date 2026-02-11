// middleware/auth.js
const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario"); // 👈 Importamos el modelo para consultar la DB

module.exports = async(req, res, next) => { // 👈 Agregamos async para la consulta
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                ok: false,
                message: "No autorizado"
            });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 🔍 Buscamos al usuario en la base de datos para tener datos frescos
        const usuario = await Usuario.findById(decoded.id);

        if (!usuario) {
            return res.status(401).json({
                ok: false,
                message: "Usuario no encontrado o cuenta eliminada"
            });
        }

        // ✅ Inyectamos el usuario completo en la petición
        // Ahora req.usuario tendrá la suscripción actualizada (estado, fechaFin, etc.)
        req.usuario = {
            id: usuario._id,
            rol: usuario.rol,
            email: usuario.email,
            suscripcion: usuario.suscripcion // 👈 Esto es lo que necesitaban tus exámenes
        };

        next();
    } catch (error) {
        console.error("❌ Error en Auth Middleware:", error.message);
        return res.status(401).json({
            ok: false,
            message: "Token inválido o expirado"
        });
    }
};