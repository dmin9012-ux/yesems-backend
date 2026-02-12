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

        // Verificación automática de expiración al cargar perfil
        // NOTA: Ajustado para usar 'estado === "active"' según tu modelo
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
        if (!nombre) return res.status(400).json({ ok: false, message: "El nombre es obligatorio" });

        const usuario = await Usuario.findByIdAndUpdate(
            req.usuario.id, { nombre }, { new: true }
        ).select("-password");

        res.json({ ok: true, usuario });
    } catch (error) {
        res.status(500).json({ ok: false, message: "Error al actualizar perfil" });
    }
};

// Cambiar MI contraseña
exports.cambiarMiPassword = async(req, res) => {
    try {
        const { passwordActual, passwordNueva } = req.body;
        if (!passwordActual || !passwordNueva) return res.status(400).json({ ok: false, message: "Datos incompletos" });

        const usuario = await Usuario.findById(req.usuario.id);
        if (!usuario) return res.status(404).json({ ok: false, message: "Usuario no encontrado" });

        const valida = await bcrypt.compare(passwordActual, usuario.password);
        if (!valida) return res.status(400).json({ ok: false, message: "La contraseña actual no es correcta" });

        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(passwordNueva, salt);
        await usuario.save();

        res.json({ ok: true, message: "Contraseña actualizada correctamente" });
    } catch (error) {
        res.status(500).json({ ok: false, message: "Error al cambiar contraseña" });
    }
};

// Eliminar MI cuenta
exports.eliminarMiCuenta = async(req, res) => {
    try {
        const usuarioId = req.usuario.id;
        await ProgresoCurso.deleteMany({ usuario: usuarioId });
        await Usuario.findByIdAndDelete(usuarioId);
        res.json({ ok: true, message: "Cuenta eliminada" });
    } catch (error) {
        res.status(500).json({ ok: false, message: "Error al eliminar cuenta" });
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
        if (!usuario) return res.status(404).json({ ok: false, message: "No encontrado" });
        res.json({ ok: true, usuario });
    } catch (error) {
        res.status(500).json({ ok: false, message: "Error al obtener" });
    }
};

exports.crearUsuario = async(req, res) => {
    try {
        const { nombre, email, password, rol } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        const usuario = new Usuario({ nombre, email, password: hash, rol: rol || "usuario", verificado: true });
        await usuario.save();
        res.status(201).json({ ok: true, message: "Creado" });
    } catch (error) {
        res.status(500).json({ ok: false, message: "Error al crear" });
    }
};

exports.actualizarUsuario = async(req, res) => {
    try {
        const usuario = await Usuario.findByIdAndUpdate(req.params.id, req.body, { new: true }).select("-password");
        res.json({ ok: true, usuario });
    } catch (error) {
        res.status(500).json({ ok: false, message: "Error al actualizar" });
    }
};

exports.eliminarUsuario = async(req, res) => {
    try {
        await ProgresoCurso.deleteMany({ usuario: req.params.id });
        await Usuario.findByIdAndDelete(req.params.id);
        res.json({ ok: true, message: "Eliminado" });
    } catch (error) {
        res.status(500).json({ ok: false, message: "Error al eliminar" });
    }
};

/* =====================================================
    💳 ESTADO DE SUSCRIPCIÓN
===================================================== */
exports.estadoSuscripcion = async(req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id).select("suscripcion");
        // Ajustado para usar .estado === "active"
        if (!usuario || !usuario.suscripcion || usuario.suscripcion.estado !== "active") {
            return res.json({ ok: true, activa: false });
        }
        res.json({ ok: true, activa: true, tipo: usuario.suscripcion.tipo, fechaFin: usuario.suscripcion.fechaFin });
    } catch (error) {
        res.status(500).json({ ok: false, message: "Error" });
    }
};

/* =====================================================
    🚀 ACTIVACIÓN MANUAL (CORRECCIÓN FINAL SEGÚN MODELO)
    POST /api/usuario/activar-premium-admin
===================================================== */
exports.activarSuscripcionAdmin = async(req, res) => {
    try {
        const { usuarioId, horas, tipo } = req.body;

        if (!usuarioId || !horas) {
            return res.status(400).json({ ok: false, message: "ID y horas requeridos" });
        }

        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) return res.status(404).json({ ok: false, message: "Usuario no encontrado" });

        const fechaFin = new Date();
        fechaFin.setTime(fechaFin.getTime() + (parseInt(horas) * 60 * 60 * 1000));

        // ✅ MAPEADO EXACTO AL MODELO:
        usuario.suscripcion = {
            estado: "active", // Obligatorio según tu enum del modelo
            tipo: tipo || "prueba_hora", // Permitido gracias a tu corrección en el modelo
            fechaInicio: new Date(),
            fechaFin: fechaFin,
            mercadoPagoId: `ADMIN_${req.usuario.id}`,
            mpStatus: "approved"
        };

        usuario.markModified('suscripcion');
        await usuario.save();

        res.json({
            ok: true,
            message: `¡Premium activado por ${horas}h para ${usuario.nombre}!`,
            fechaFin
        });

    } catch (error) {
        console.error("❌ ERROR EN ACTIVACIÓN:", error);
        res.status(500).json({ ok: false, message: "Error interno del servidor" });
    }
};

// ... mantener funciones de recuperación de contraseña abajo si las necesitas