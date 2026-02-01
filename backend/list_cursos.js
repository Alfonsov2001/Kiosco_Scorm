const db = require('./src/config/db');
const fs = require('fs');

async function listCursos() {
    try {
        const [schema] = await db.query("DESCRIBE cursos");
        const [rows] = await db.query("SELECT * FROM cursos");

        const output = {
            schema: schema,
            cursos: rows
        };

        fs.writeFileSync('diagnostic_output.json', JSON.stringify(output, null, 2));
        console.log('Datos guardados en diagnostic_output.json');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

listCursos();
