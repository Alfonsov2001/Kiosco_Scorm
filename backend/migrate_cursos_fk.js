const db = require('./src/config/db');

async function migrateCursos() {
    try {
        const [rows] = await db.query("SHOW COLUMNS FROM cursos LIKE 'categoria_id'");
        if (rows.length === 0) {
            console.log("Añadiendo columna categoria_id a cursos...");
            await db.query("ALTER TABLE cursos ADD COLUMN categoria_id INT DEFAULT NULL");
            // Opcional: FK constraint
            // await db.query("ALTER TABLE cursos ADD CONSTRAINT fk_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id)");
            console.log("Columna añadida.");
        } else {
            console.log("Columna categoria_id ya existe.");
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
migrateCursos();
