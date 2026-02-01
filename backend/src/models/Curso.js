const db = require('../config/db');

class Curso {
    static async getAll() {
        try {
            const [rows] = await db.query('SELECT * FROM cursos');
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async getById(id) {
        try {
            const [rows] = await db.query('SELECT * FROM cursos WHERE id = ?', [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async create(data) {
        try {
            const { titulo, descripcion, ruta_carpeta, punto_entrada, categoria_id, imagen_url } = data;
            const [result] = await db.query(
                'INSERT INTO cursos (titulo, descripcion, ruta_carpeta, punto_entrada, categoria_id, imagen_url) VALUES (?, ?, ?, ?, ?, ?)',
                [titulo, descripcion, ruta_carpeta, punto_entrada, categoria_id || null, imagen_url || null]
            );
            return result;
        } catch (error) {
            throw error;
        }
    }

    static async delete(id) {
        try {
            // Primero eliminamos el progreso asociado (si no hay cascada en BD)
            await db.query('DELETE FROM progreso WHERE curso_id = ?', [id]);
            // Luego el curso
            const [result] = await db.query('DELETE FROM cursos WHERE id = ?', [id]);
            return result;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Curso;
