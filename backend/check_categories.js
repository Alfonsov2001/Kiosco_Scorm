const db = require('./src/config/db');

async function listCategories() {
    try {
        console.log('Consultando tabla categorias...');
        const [rows] = await db.query("SELECT * FROM categorias");
        console.log('Filas encontradas:', rows);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

listCategories();
