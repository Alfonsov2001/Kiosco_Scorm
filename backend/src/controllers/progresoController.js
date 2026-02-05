const Progreso = require('../models/Progreso');

exports.guardarProgreso = async (req, res) => {
    const { usuarioId, cursoId, cmi } = req.body;

    if (!usuarioId || !cursoId) {
        return res.status(400).json({ mensaje: 'Faltan datos (usuarioId, cursoId)' });
    }

    try {
        console.log(`💾 Guardando progreso - Usuario: ${usuarioId}, Curso: ${cursoId}, Status: ${cmi?.cmi_lesson_status}, Score: ${cmi?.cmi_score_raw}`);
        await Progreso.upsert(usuarioId, cursoId, cmi);
        console.log(`✅ Progreso guardado exitosamente`);
        res.json({ mensaje: 'Progreso guardado' });
    } catch (error) {
        console.error('❌ Error guardando progreso:', error);
        res.status(500).json({ mensaje: 'Error guardando progreso' });
    }
};

exports.obtenerProgreso = async (req, res) => {
    const { usuarioId, cursoId } = req.query;

    if (!usuarioId || !cursoId) {
        return res.status(400).json({ mensaje: 'Usuario y Curso requeridos' });
    }

    try {
        const progreso = await Progreso.get(usuarioId, cursoId);
        res.json(progreso || {});
    } catch (error) {
        res.status(500).json({ mensaje: 'Error obteniendo progreso' });
    }
};

exports.obtenerRecientes = async (req, res) => {
    const { usuarioId } = req.query;

    if (!usuarioId) return res.status(400).json({ mensaje: 'UsuarioId requerido' });

    try {
        const recientes = await Progreso.getRecientes(usuarioId);
        res.json(recientes);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error obteniendo historial' });
    }
};

// NUEVO: Obtener todos los progresos de un usuario
exports.obtenerTodos = async (req, res) => {
    const { usuarioId } = req.query;

    if (!usuarioId) {
        return res.status(400).json({ mensaje: 'UsuarioId requerido' });
    }

    try {
        const progresos = await Progreso.getAllByUsuario(usuarioId);
        res.json(progresos);
    } catch (error) {
        console.error('Error obteniendo todos los progresos:', error);
        res.status(500).json({ mensaje: 'Error obteniendo progresos' });
    }
};
