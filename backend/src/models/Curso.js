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

    static async create(data) {
        try {
            const { titulo, descripcion, ruta_carpeta, punto_entrada } = data;
            const [result] = await db.query(
                'INSERT INTO cursos (titulo, descripcion, ruta_carpeta, punto_entrada) VALUES (?, ?, ?, ?)',
                [titulo, descripcion, ruta_carpeta, punto_entrada]
            );
            return result;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Curso;
