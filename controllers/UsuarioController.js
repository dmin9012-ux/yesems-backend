const Usuario = require("../models/Usuario");
const ProgresoCurso = require("../models/ProgresoCurso");
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

        // ✅ CORRECCIÓN: Tu modelo usa 'estado' (string), no 'activa' (boolean)
        if (usuario.suscripcion && usuario.suscripcion.estado === "active" && usuario.suscripcion.fechaFin) {
            const ahora = new Date();
            const fechaFin = new Date(usuario.suscripcion.fechaFin);
            if (ahora > fechaFin) {
                usuario.suscripcion.estado = "expired";
                usuario.suscripcion.mpStatus = "expired";
                await usuario.save();
            }
        }

        res.json({ ok: true, usuario });
    } catch (error) {
        console.error("❌ Error en obtenerPerfil:", error);
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
        console.error("❌ Error en actualizarMiPerfil:", error);
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
        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(passwordNueva, salt);
        await usuario.save();
        res.json({ ok: true, message: "Contraseña actualizada correctamente" });
    } catch (error) {
        console.error("❌ Error en cambiarMiPassword:", error);
        res.status(500).json({ ok: false, message: "Error al cambiar contraseña" });
    }
};

// Eliminar MI cuenta
exports.eliminarMiCuenta = async(req, res) => {
    try {
        const usuarioId = req.usuario.id;
        await ProgresoCurso.deleteMany({ usuario: usuarioId });
        await Usuario.findByIdAndDelete(usuarioId);
        res.json({ ok: true, message: "Cuenta y registros de progreso eliminados correctamente" });
    } catch (error) {
        console.error("❌ Error en eliminarMiCuenta:", error);
        res.status(500).json({ ok: false, message: "Error al eliminar cuenta" });
    }
};

/* =====================================================
    🔐 RECUPERAR CONTRASEÑA (FLUJO 3 PASOS)
===================================================== */

exports.solicitarResetPasswordCode = async(req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.json({ ok: true, message: "Si el correo existe, se enviará un código de recuperación" });
        }
        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.json({ ok: true, message: "Si el correo existe, se enviará un código de recuperación" });
        }
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();
        usuario.resetPasswordCode = codigo;
        usuario.resetPasswordCodeExpires = Date.now() + 10 * 60 * 1000;
        await usuario.save();
        const contenidoHTML = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>Recuperación de contraseña - YES EMS</h2>
                <p>Hola <strong>${usuario.nombre}</strong>,</p>
                <p>Tu código de seguridad para restablecer tu contraseña es: <strong>${codigo}</strong></p>
                <p>Este código expira en 10 minutos.</p>
            </div>
        `;
        await enviarCorreo(usuario.email, "Código de recuperación de contraseña", contenidoHTML);
        res.json({ ok: true, message: "Si el correo existe, se enviará un código de recuperación" });
    } catch (error) {
        console.error("❌ Error en solicitarResetPasswordCode:", error);
        res.status(500).json({ ok: false, message: "Error al solicitar código" });
    }
};

exports.verificarResetPasswordCode = async(req, res) => {
    try {
        const { email, codigo } = req.body;
        if (!email || !codigo) return res.status(400).json({ ok: false, message: "Datos incompletos" });
        const usuario = await Usuario.findOne({
            email,
            resetPasswordCode: codigo,
            resetPasswordCodeExpires: { $gt: Date.now() }
        });
        if (!usuario) return res.status(400).json({ ok: false, message: "El código es inválido o ha expirado" });
        res.json({ ok: true, message: "Código verificado correctamente" });
    } catch (error) {
        res.status(500).json({ ok: false, message: "Error al verificar código" });
    }
};

exports.resetPasswordConCodigo = async(req, res) => {
    try {
        const { email, codigo, passwordNueva } = req.body;
        if (!email || !codigo || !passwordNueva) return res.status(400).json({ ok: false, message: "Datos incompletos" });
        const usuario = await Usuario.findOne({
            email,
            resetPasswordCode: codigo,
            resetPasswordCodeExpires: { $gt: Date.now() }
        });
        if (!usuario) return res.status(400).json({ ok: false, message: "El código es inválido o ha expirado" });
        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(passwordNueva, salt);
        usuario.resetPasswordCode = undefined;
        usuario.resetPasswordCodeExpires = undefined;
        await usuario.save();
        res.json({ ok: true, message: "Contraseña restablecida correctamente" });
    } catch (error) {
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
        res.status(500).json({ ok: false, message: "Error al obtener usuarios" });
    }
};

exports.obtenerUsuario = async(req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id).select("-password");
        if (!usuario) return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
        res.json({ ok: true, usuario });
    } catch (error) {
        res.status(500).json({ ok: false, message: "Error al obtener usuario" });
    }
};

exports.crearUsuario = async(req, res) => {
    try {
        const { nombre, email, password, rol } = req.body;
        const existe = await Usuario.findOne({ email });
        if (existe) return res.status(400).json({ ok: false, message: "El usuario ya existe" });
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        const usuario = new Usuario({
            nombre,
            email,
            password: hash,
            rol: rol || "usuario",
            verificado: true
        });
        await usuario.save();
        res.status(201).json({ ok: true, message: "Usuario creado correctamente" });
    } catch (error) {
        res.status(500).json({ ok: false, message: "Error al crear usuario" });
    }
};

exports.actualizarUsuario = async(req, res) => {
    try {
        const usuario = await Usuario.findByIdAndUpdate(
            req.params.id,
            req.body, { new: true }
        ).select("-password");
        if (!usuario) return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
        res.json({ ok: true, usuario });
    } catch (error) {
        res.status(500).json({ ok: false, message: "Error al actualizar usuario" });
    }
};

exports.eliminarUsuario = async(req, res) => {
    try {
        const usuarioId = req.params.id;
        await ProgresoCurso.deleteMany({ usuario: usuarioId });
        const usuario = await Usuario.findByIdAndDelete(usuarioId);
        if (!usuario) return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
        res.json({ ok: true, message: "Usuario y progreso eliminados correctamente" });
    } catch (error) {
        res.status(500).json({ ok: false, message: "Error al eliminar usuario" });
    }
};

exports.cambiarPassword = async(req, res) => {
    try {
        const { passwordNueva } = req.body;
        if (!passwordNueva) return res.status(400).json({ ok: false, message: "La nueva contraseña es obligatoria" });
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(passwordNueva, salt);
        const usuario = await Usuario.findByIdAndUpdate(req.params.id, { password: hash });
        if (!usuario) return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
        res.json({ ok: true, message: "Contraseña actualizada correctamente" });
    } catch (error) {
        res.status(500).json({ ok: false, message: "Error al cambiar contraseña" });
    }
};

/* =====================================================
    💳 ESTADO DE SUSCRIPCIÓN
===================================================== */
exports.estadoSuscripcion = async(req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const usuario = await Usuario.findById(usuarioId).select("suscripcion");
        if (!usuario) return res.status(404).json({ ok: false, message: "Usuario no encontrado" });

        // ✅ CORRECCIÓN: Tu modelo usa 'estado === active'
        if (!usuario.suscripcion || usuario.suscripcion.estado !== "active") {
            return res.status(200).json({ ok: true, activa: false, mensaje: "No tienes una suscripción activa" });
        }

        const ahora = new Date();
        const fechaFin = new Date(usuario.suscripcion.fechaFin);

        if (ahora > fechaFin) {
            usuario.suscripcion.estado = "expired";
            usuario.suscripcion.mpStatus = "expired";
            await usuario.save();
            return res.status(200).json({ ok: true, activa: false, mensaje: "La suscripción ha expirado" });
        }

        return res.status(200).json({
            ok: true,
            activa: true,
            tipo: usuario.suscripcion.tipo,
            fechaInicio: usuario.suscripcion.fechaInicio,
            fechaFin: usuario.suscripcion.fechaFin,
            status: usuario.suscripcion.mpStatus
        });
    } catch (error) {
        console.error("❌ Error estadoSuscripcion:", error.message);
        return res.status(500).json({ ok: false, message: "Error al consultar suscripción" });
    }
};

/* =====================================================
    🚀 ACTIVACIÓN MANUAL (SOLUCIÓN ERROR 400)
===================================================== */
exports.activarSuscripcionAdmin = async(req, res) => {
    try {
        // Aceptamos usuarioId o id para robustez
        const usuarioId = req.body.usuarioId || req.body.id;
        const horas = req.body.horas;

        if (!usuarioId || !horas) {
            return res.status(400).json({ ok: false, message: "Faltan datos (ID o Horas)" });
        }

        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) return res.status(404).json({ ok: false, message: "Usuario no encontrado" });

        const fechaFin = new Date();
        fechaFin.setTime(fechaFin.getTime() + (parseInt(horas) * 60 * 60 * 1000));

        // ✅ MAPEADO EXACTO AL MODELO: Usamos 'estado: active'
        usuario.suscripcion = {
            estado: "active",
            tipo: req.body.tipo || "prueba_hora",
            fechaInicio: new Date(),
            fechaFin: fechaFin,
            mpStatus: "approved",
            mercadoPagoId: `ADMIN_ACT_${req.usuario.id}`
        };

        usuario.markModified('suscripcion');
        await usuario.save();

        res.json({ ok: true, message: `¡Premium activado por ${horas}h!`, fechaFin });

    } catch (error) {
        console.error("❌ Error en activarSuscripcionAdmin:", error);
        res.status(500).json({ ok: false, message: "Error interno" });
    }
};