const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1. CORS GLOBAL - Permitir peticiones desde Angular
app.use(cors({
    origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// 2. MIDDLEWARE DE SEGURIDAD PARA IFRAMES (SCORM)
// Esto es vital para que el navegador no bloquee el SCORM dentro del iframe
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'ALLOWALL'); // Permite que se vea en iframe
    res.removeHeader('X-Frame-Options'); // Elimina bloqueos antiguos
    // CSP: Permite que localhost incruste el contenido
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self' http://localhost:4200 http://127.0.0.1:4200");
    next();
});

// Parsear JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 3. AQUÍ ESTÁ LA SOLUCIÓN (SERVIR UPLOADS)
// ==========================================
// Hacemos pública la carpeta 'uploads' donde se guardan los ZIPs descomprimidos
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res, filePath) => {
        // Forzamos cabeceras permisivas también en los archivos estáticos
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('X-Frame-Options', 'ALLOWALL');
    }
}));

// Servir archivos estáticos (por si acaso usas public/cursos)
app.use('/cursos', express.static(path.join(__dirname, 'public/cursos'), {
    setHeaders: (res, filePath) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('X-Frame-Options', 'ALLOWALL');
    }
}));

// Servir carpeta public general
app.use(express.static(path.join(__dirname, 'public')));

// Ruta de prueba
app.get('/test', (req, res) => {
    res.json({ status: 'OK', message: 'Backend funcionando y sirviendo archivos estáticos' });
});

// Importar rutas
const cursoRoutes = require('./src/routes/cursoRoutes');
const authRoutes = require('./src/routes/authRoutes');
const progresoRoutes = require('./src/routes/progresoRoutes');
const categoriaRoutes = require('./src/routes/categoriaRoutes');

// Usar rutas de API
app.use('/api/cursos', cursoRoutes);
app.use('/api', authRoutes);
app.use('/api/progreso', progresoRoutes);
app.use('/api/categorias', categoriaRoutes);

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('Error del servidor:', err);
    res.status(500).json({ mensaje: 'Error interno del servidor', error: err.message });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('========================================');
    console.log(`🚀 SERVIDOR CORRIENDO EN PUERTO ${PORT}`);
    console.log('========================================');
    console.log('📂 CARPETAS PÚBLICAS:');
    console.log(`   -> /uploads (Para los cursos subidos)`);
    console.log(`   -> /public  (Assets generales)`);
    console.log('========================================');
});