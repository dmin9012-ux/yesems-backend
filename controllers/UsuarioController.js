const Usuario = require("../models/Usuario");
const bcrypt = require("bcryptjs");
const enviarCorreo = require("../util/enviarCorreo");

/* =====================================================
   👤 USUARIO NORMAL
===================================================== */

// Obtener MI perfil
exports.obtenerPerfil = async(req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id).select("-password");
        if (!usuario) {
            return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
        }
        res.json({ ok: true, usuario });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, message: "Error al obtener perfil" });
    }
};

// Actualizar MIS datos
exports.actualizarMiPerfil = async(req, res) => {
    try {
        const { nombre } = req.body;

        if (!nombre) {
            return res.status(400).json({ ok: false, message: "El nombre es obligatorio" });
        }

        const usuario = await Usuario.findByIdAndUpdate(
            req.usuario.id, { nombre }, { new: true }
        ).select("-password");

        res.json({ ok: true, usuario });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, message: "Error al actualizar perfil" });
    }
};

// Cambiar MI contraseña
exports.cambiarMiPassword = async(req, res) => {
    try {
        const { passwordActual, passwordNueva } = req.body;

        if (!passwordActual || !passwordNueva) {
            return res.status(400).json({ ok: false, message: "Datos incompletos" });
        }

        const usuario = await Usuario.findById(req.usuario.id);
        if (!usuario) {
            return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
        }

        const valida = await bcrypt.compare(passwordActual, usuario.password);
        if (!valida) {
            return res.status(400).json({ ok: false, message: "La contraseña actual no es correcta" });
        }

        usuario.password = await bcrypt.hash(passwordNueva, await bcrypt.genSalt(10));
        await usuario.save();

        res.json({ ok: true, message: "Contraseña actualizada correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, message: "Error al cambiar contraseña" });
    }
};

// Eliminar MI cuenta
exports.eliminarMiCuenta = async(req, res) => {
    try {
        await Usuario.findByIdAndDelete(req.usuario.id);
        res.json({ ok: true, message: "Cuenta eliminada correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, message: "Error al eliminar cuenta" });
    }
};

/* =====================================================
   🔐 RECUPERAR CONTRASEÑA (FLUJO 3 PASOS)
===================================================== */

// 1️⃣ Solicitar código
exports.solicitarResetPasswordCode = async(req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.json({
                ok: true,
                message: "Si el correo existe, se enviará un código de recuperación"
            });
        }

        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.json({
                ok: true,
                message: "Si el correo existe, se enviará un código de recuperación"
            });
        }

        const codigo = Math.floor(100000 + Math.random() * 900000).toString();
        usuario.resetPasswordCode = codigo;
        usuario.resetPasswordCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutos
        await usuario.save();

        const contenidoHTML = `
      <p>Hola <strong>${usuario.nombre}</strong>,</p>
      <p>Recibimos una solicitud para restablecer tu contraseña en <strong>YES EMS</strong>.</p>
      <p>Ingresa el siguiente código en la aplicación:</p>
      <div class="code-box">${codigo}</div>
      <p>Este código es válido por <strong>10 minutos</strong>.</p>
      <p class="warning">Si no solicitaste este cambio, puedes ignorar este correo.</p>
    `;

        await enviarCorreo(usuario.email, "Recuperación de contraseña", contenidoHTML);

        res.json({
            ok: true,
            message: "Si el correo existe, se enviará un código de recuperación"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, message: "Error al solicitar código" });
    }
};

// 2️⃣ Verificar código
exports.verificarResetPasswordCode = async(req, res) => {
    try {
        const { email, codigo } = req.body;

        if (!email || !codigo) {
            return res.status(400).json({ ok: false, message: "Datos incompletos" });
        }

        const usuario = await Usuario.findOne({
            email,
            resetPasswordCode: codigo,
            resetPasswordCodeExpires: { $gt: Date.now() }
        });

        if (!usuario) {
            return res.status(400).json({ ok: false, message: "El código es inválido o ha expirado" });
        }

        res.json({ ok: true, message: "Código verificado correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, message: "Error al verificar código" });
    }
};

// 3️⃣ Restablecer contraseña
exports.resetPasswordConCodigo = async(req, res) => {
    try {
        const { email, codigo, passwordNueva } = req.body;

        if (!email || !codigo || !passwordNueva) {
            return res.status(400).json({ ok: false, message: "Datos incompletos" });
        }

        const usuario = await Usuario.findOne({
            email,
            resetPasswordCode: codigo,
            resetPasswordCodeExpires: { $gt: Date.now() }
        });

        if (!usuario) {
            return res.status(400).json({ ok: false, message: "El código es inválido o ha expirado" });
        }

        usuario.password = await bcrypt.hash(passwordNueva, await bcrypt.genSalt(10));
        usuario.resetPasswordCode = undefined;
        usuario.resetPasswordCodeExpires = undefined;
        await usuario.save();

        res.json({ ok: true, message: "Contraseña restablecida correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, message: "Error al restablecer contraseña" });
    }
};

/* =====================================================
   🛡️ ADMIN
===================================================== */

exports.obtenerUsuarios = async(req, res) => {
    try {
        const usuarios = await Usuario.find().select("-password");
        res.json({ ok: true, usuarios });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, message: "Error al obtener usuarios" });
    }
};

exports.obtenerUsuario = async(req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id).select("-password");
        if (!usuario) {
            return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
        }
        res.json({ ok: true, usuario });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, message: "Error al obtener usuario" });
    }
};

exports.crearUsuario = async(req, res) => {
    try {
        const { nombre, email, password, rol } = req.body;

        const existe = await Usuario.findOne({ email });
        if (existe) {
            return res.status(400).json({ ok: false, message: "El usuario ya existe" });
        }

        const hash = await bcrypt.hash(password, await bcrypt.genSalt(10));

        const usuario = new Usuario({
            nombre,
            email,
            password: hash,
            rol,
            verificado: true
        });

        await usuario.save();
        res.status(201).json({ ok: true, message: "Usuario creado correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, message: "Error al crear usuario" });
    }
};

exports.actualizarUsuario = async(req, res) => {
    try {
        const usuario = await Usuario.findByIdAndUpdate(
            req.params.id,
            req.body, { new: true }
        ).select("-password");

        if (!usuario) {
            return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
        }

        res.json({ ok: true, usuario });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, message: "Error al actualizar usuario" });
    }
};

exports.eliminarUsuario = async(req, res) => {
    try {
        const usuario = await Usuario.findByIdAndDelete(req.params.id);
        if (!usuario) {
            return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
        }
        res.json({ ok: true, message: "Usuario eliminado correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, message: "Error al eliminar usuario" });
    }
};

exports.cambiarPassword = async(req, res) => {
    try {
        const { passwordNueva } = req.body;
        if (!passwordNueva) {
            return res.status(400).json({ ok: false, message: "La nueva contraseña es obligatoria" });
        }

        const hash = await bcrypt.hash(passwordNueva, await bcrypt.genSalt(10));
        await Usuario.findByIdAndUpdate(req.params.id, { password: hash });

        res.json({ ok: true, message: "Contraseña actualizada correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, message: "Error al cambiar contraseña" });
    }
};