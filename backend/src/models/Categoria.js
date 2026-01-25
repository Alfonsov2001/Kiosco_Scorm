const db = require('../config/db');

class Categoria {
    static async getAll() {
        try {
            const [rows] = await db.query('SELECT * FROM categorias ORDER BY nombre ASC');
            console.log('Model Categoria.getAll rows:', rows);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async create(nombre) {
        try {
            const [result] = await db.query('INSERT INTO categorias (nombre) VALUES (?)', [nombre]);
            return { id: result.insertId, nombre };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Categoria;
