const db = require('./src/config/db');

async function inspect() {
    try {
        console.log('Inspeccionando tabla categorias...');
        const [rows] = await db.query("DESCRIBE categorias");
        console.log(rows);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);

        // Si falla, quizás no existe, tratamos de ver las tablas
        try {
            const [tables] = await db.query("SHOW TABLES");
            console.log('Tablas existentes:', tables);
        } catch (e) {
            console.error(e);
        }
        process.exit(1);
    }
}

inspect();
