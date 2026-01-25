const db = require('./src/config/db');

async function inspect() {
    try {
        console.log('Inspeccionando tabla PROGRESO...');
        const [rows] = await db.query("DESCRIBE progreso");
        console.log(rows);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}
inspect();
