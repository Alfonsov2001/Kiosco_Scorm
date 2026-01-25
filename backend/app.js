const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./src/config/db'); // Mantenemos la conexión para que se inicie el pool
const cursoRoutes = require('./src/routes/cursoRoutes');
const authRoutes = require('./src/routes/authRoutes');

const app = express();
const PORT = 3000;

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json({ limit: '1000mb' }));
app.use(express.urlencoded({ limit: '1000mb', extended: true }));


app.use('/cursos', express.static(path.join(__dirname, 'public/cursos')));

// --- ROUTES ---
app.use('/api/cursos', cursoRoutes);
app.use('/api', authRoutes);
app.use('/api/progreso', require('./src/routes/progresoRoutes'));
app.use('/api/categorias', require('./src/routes/categoriaRoutes'));

// Test route
app.get('/test', (req, res) => res.json({ status: 'OK (MVC)' }));

// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`🚀 SERVIDOR LISTO EN PUERTO ${PORT}`);
    console.log(`✅ VERSIÓN CON CATEGORÍAS CARGADA`);
    console.log(`📂 Rutas disponibles: /api/cursos, /api/login, /api/progreso, /api/categorias`);
});
