const db = require('../config/db');

class Progreso {
    static async upsert(usuarioId, cursoId, data) {
        try {
            const query = `
                INSERT INTO progreso (usuario_id, curso_id, cmi_lesson_status, cmi_score_raw, cmi_location, cmi_suspend_data)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    cmi_lesson_status = VALUES(cmi_lesson_status),
                    cmi_score_raw = VALUES(cmi_score_raw),
                    cmi_location = VALUES(cmi_location),
                    cmi_suspend_data = VALUES(cmi_suspend_data),
                    fecha_actualizacion = CURRENT_TIMESTAMP
            `;

            const params = [
                usuarioId,
                cursoId,
                data.cmi_lesson_status || 'not attempted',
                data.cmi_score_raw || 0,
                data.cmi_location || '',
                data.cmi_suspend_data || ''
            ];

            const [result] = await db.query(query, params);
            return result;
        } catch (error) {
            throw error;
        }
    }

    static async get(usuarioId, cursoId) {
        try {
            const [rows] = await db.query(
                'SELECT * FROM progreso WHERE usuario_id = ? AND curso_id = ?',
                [usuarioId, cursoId]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async getRecientes(usuarioId) {
        try {
            const query = `
                SELECT p.*, c.titulo, c.descripcion, c.ruta_carpeta, c.punto_entrada, c.fecha_subida
                FROM progreso p
                JOIN cursos c ON p.curso_id = c.id
                WHERE p.usuario_id = ?
                ORDER BY p.fecha_actualizacion DESC
                LIMIT 5
            `;
            const [rows] = await db.query(query, [usuarioId]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // NUEVO: Obtener todos los progresos de un usuario
    static async getAllByUsuario(usuarioId) {
        try {
            const query = `
                SELECT 
                    p.id,
                    p.usuario_id,
                    p.curso_id,
                    p.cmi_lesson_status,
                    p.cmi_score_raw,
                    p.cmi_location,
                    p.cmi_suspend_data,
                    p.fecha_actualizacion
                FROM progreso p
                WHERE p.usuario_id = ?
                ORDER BY p.fecha_actualizacion DESC
            `;
            const [rows] = await db.query(query, [usuarioId]);
            return rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Progreso;
