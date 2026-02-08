const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS setup - sin esto Angular no puede hablar con el backend
app.use(cors({
    origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// CRÍTICO: Headers para que los SCORMs funcionen en iframes
// Sin esto, el navegador bloquea el contenido del iframe y la API SCORM no se conecta
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.removeHeader('X-Frame-Options'); // Limpiar cualquier header previo
    // CSP modificado para permitir embeds desde localhost:4200
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self' http://localhost:4200 http://127.0.0.1:4200");
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos subidos (imágenes de cursos)
// NOTA: Los SCORM descomprimidos van a public/cursos, no aquí
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res, filePath) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('X-Frame-Options', 'ALLOWALL');
    }
}));

// Carpeta principal de cursos SCORM descomprimidos
// Angular usa el proxy para acceder a /cursos
app.use('/cursos', express.static(path.join(__dirname, 'public/cursos'), {
    setHeaders: (res, filePath) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('X-Frame-Options', 'ALLOWALL');
    }
}));

app.use(express.static(path.join(__dirname, 'public')));

// Endpoint de prueba para verificar que el servidor está vivo
app.get('/test', (req, res) => {
    res.json({ status: 'OK', message: 'Backend funcionando y sirviendo archivos estáticos' });
});

// Rutas de la API
const cursoRoutes = require('./src/routes/cursoRoutes');
const authRoutes = require('./src/routes/authRoutes');
const progresoRoutes = require('./src/routes/progresoRoutes');
const categoriaRoutes = require('./src/routes/categoriaRoutes');

app.use('/api/cursos', cursoRoutes);
app.use('/api', authRoutes);  // Login y registro van directo a /api/login y /api/register
app.use('/api/progreso', progresoRoutes);
app.use('/api/categorias', categoriaRoutes);

// Error handler genérico
app.use((err, req, res, next) => {
    console.error('Error del servidor:', err);
    res.status(500).json({ mensaje: 'Error interno del servidor', error: err.message });
});

// Arrancar el servidor
app.listen(PORT, () => {
    console.log('========================================');
    console.log(`🚀 SERVIDOR CORRIENDO EN PUERTO ${PORT}`);
    console.log('========================================');
    console.log('📂 CARPETAS PÚBLICAS:');
    console.log(`   -> /uploads (Para los cursos subidos)`);
    console.log(`   -> /public  (Assets generales)`);
    console.log('========================================');
});
