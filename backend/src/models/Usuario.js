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
            const { email, rol } = data; // Aceptamos rol
            const rolFinal = rol || 'alumno'; // Default alumno
            const [result] = await db.query('INSERT INTO usuarios (email, rol) VALUES (?, ?)', [email, rolFinal]);
            return { id: result.insertId, email, rol: rolFinal };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Usuario;
