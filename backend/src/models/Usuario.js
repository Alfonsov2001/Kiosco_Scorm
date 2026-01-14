const db = require('../config/db');

class Usuario {
    static async findByEmail(email) {
        try {
            const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
            return rows[0]; // Retorna undefined si no encuentra nada
        } catch (error) {
            throw error;
        }
    }

    static async create(data) {
        try {
            const { email } = data;
            const [result] = await db.query('INSERT INTO usuarios (email) VALUES (?)', [email]);
            return { id: result.insertId, email };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Usuario;
