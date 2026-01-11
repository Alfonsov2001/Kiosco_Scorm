const mysql = require('mysql2');

// Configuración típica de XAMPP
// Usuario: root, Contraseña: (vacía), Host: localhost
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'kiosco_scorm',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Promisify permite usar async/await (más moderno y limpio)
const promisePool = pool.promise();

console.log('Configuración de BD cargada...');

module.exports = promisePool;