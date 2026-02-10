// middleware/auth.js
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
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

        /*
          decoded DEBE contener:
          {
            id: usuario._id,
            rol,
            email,
            iat,
            exp
          }
        */

        req.usuario = {
            id: decoded.id,
            rol: decoded.rol,
            email: decoded.email
        };

        next();
    } catch (error) {
        return res.status(401).json({
            ok: false,
            message: "Token inválido o expirado"
        });
    }
};