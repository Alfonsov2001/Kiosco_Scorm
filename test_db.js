const db = require('./src/config/db');

async function test() {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS resultado');
        console.log('✅ Conexión OK:', rows);
        
        const [cursos] = await db.query('SELECT * FROM cursos');
        console.log('✅ Cursos:', cursos);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

test();