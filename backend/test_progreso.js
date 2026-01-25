const http = require('http');

// Simular petición GET /api/progreso/obtener?usuarioId=1&cursoId=1
// Asumimos que existen IDs 1, ajusta si es necesario
const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/progreso/obtener?usuarioId=1&cursoId=1', // ID TEST
    method: 'GET'
};

console.log(`Pidiendo: ${options.path}`);

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
    res.on('end', () => {
        console.log('No more data.');
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
