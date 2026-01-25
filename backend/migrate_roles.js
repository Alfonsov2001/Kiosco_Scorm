const db = require('./src/config/db');

async function migrate() {
    try {
        console.log('Iniciando migración...');
        const [rows] = await db.query("SHOW COLUMNS FROM usuarios LIKE 'rol'");

        if (rows.length === 0) {
            await db.query("ALTER TABLE usuarios ADD COLUMN rol ENUM('alumno', 'profesor') DEFAULT 'alumno' AFTER email");
            console.log("Columna 'rol' añadida correctamente.");
        } else {
            console.log("La columna 'rol' ya existe.");
        }

        // Actualizar el usuario alfon@gmail.com a profesor para pruebas
        await db.query("UPDATE usuarios SET rol = 'profesor' WHERE email = 'alfon@gmail.com'");
        console.log("Usuario alfon@gmail.com actualizado a profesor.");

        process.exit(0);
    } catch (error) {
        console.error('Error en la migración:', error);
        process.exit(1);
    }
}

migrate();
