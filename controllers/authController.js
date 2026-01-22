const Usuario = require("../models/Usuario");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const enviarCorreo = require("../utils/enviarCorreo");

/* =========================
   REGISTRO
========================= */
exports.registro = async(req, res) => {
    try {
        const { nombre, email, password } = req.body;

        const existe = await Usuario.findOne({ email });
        if (existe) {
            return res.status(400).json({ ok: false, message: "El email ya está registrado" });
        }

        const hashed = await bcrypt.hash(password, 10);

        const tokenVerificacion = crypto.randomBytes(32).toString("hex");
        const tokenExpira = Date.now() + 1000 * 60 * 60 * 24;

        const usuario = new Usuario({
            nombre,
            email,
            password: hashed,
            tokenVerificacion,
            tokenExpira,
            verificado: false
        });

        await usuario.save();

        const enlace = `${process.env.FRONTEND_URL}/verificar-correo/${tokenVerificacion}`;

        await enviarCorreo(
            email,
            "Verifica tu cuenta",
            `<p>Haz clic para verificar:</p><a href="${enlace}">Verificar cuenta</a>`
        );

        res.json({
            ok: true,
            message: "Usuario registrado. Revisa tu correo."
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, message: "Error en registro" });
    }
};

/* =========================
   🔹 VERIFICAR CUENTA
========================= */
exports.verificar = async(req, res) => {
    try {
        const { token } = req.params;

        const usuario = await Usuario.findOne({ tokenVerificacion: token });
        if (!usuario) {
            return res.status(400).json({
                ok: false,
                message: "Token inválido o ya usado"
            });
        }

        if (usuario.tokenExpira < Date.now()) {
            return res.status(400).json({
                ok: false,
                message: "Token expirado"
            });
        }

        usuario.verificado = true;
        usuario.tokenVerificacion = null;
        usuario.tokenExpira = null;
        await usuario.save();

        res.json({
            ok: true,
            message: "Cuenta verificada correctamente"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, message: "Error al verificar" });
    }
};

/* =========================
   🔹 LOGIN (CORREGIDO)
========================= */
exports.login = async(req, res) => {
    try {
        const { email, password } = req.body;

        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(400).json({ ok: false, message: "Usuario no encontrado" });
        }

        if (!usuario.verificado) {
            return res.status(403).json({
                ok: false,
                message: "Debes verificar tu correo"
            });
        }

        const coincide = await bcrypt.compare(password, usuario.password);
        if (!coincide) {
            return res.status(400).json({ ok: false, message: "Contraseña incorrecta" });
        }

        const token = jwt.sign({ id: usuario._id, rol: usuario.rol },
            process.env.JWT_SECRET, { expiresIn: "7d" }
        );

        res.json({
            ok: true,
            token,
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error("❌ Error login:", error);
        res.status(500).json({ ok: false, message: "Error en login" });
    }
};

/* =========================
   🔹 REENVIAR VERIFICACIÓN
========================= */
exports.reenviarVerificacion = async(req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                ok: false,
                message: "El email es obligatorio"
            });
        }

        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(400).json({
                ok: false,
                message: "Usuario no encontrado"
            });
        }

        if (usuario.verificado) {
            return res.status(400).json({
                ok: false,
                message: "La cuenta ya está verificada"
            });
        }

        // Generar nuevo token
        const tokenVerificacion = crypto.randomBytes(32).toString("hex");
        const tokenExpira = Date.now() + 1000 * 60 * 60 * 24;

        usuario.tokenVerificacion = tokenVerificacion;
        usuario.tokenExpira = tokenExpira;
        await usuario.save();

        const enlace = `${process.env.FRONTEND_URL}/verificar-correo/${tokenVerificacion}`;

        await enviarCorreo(
            email,
            "Reenvío de verificación",
            `<p>Haz clic para verificar tu cuenta:</p><a href="${enlace}">Verificar cuenta</a>`
        );

        res.json({
            ok: true,
            message: "Correo de verificación reenviado"
        });

    } catch (error) {
        console.error("❌ Error reenviar verificación:", error);
        res.status(500).json({
            ok: false,
            message: "Error al reenviar verificación"
        });
    }
};