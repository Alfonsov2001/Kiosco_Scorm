const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');           // <--- NECESARIO para leer carpetas
const multer = require('multer');   // <--- NECESARIO para subir archivos
const AdmZip = require('adm-zip');  // <--- NECESARIO para descomprimir
const db = require('./src/config/db'); 
// Si tienes rutas separadas, puedes mantenerlas, pero la subida la haremos aquí para simplificar
// const cursoRoutes = require('./src/routes/cursoRoutes'); 

const app = express();
const PORT = 3000;

// --- CONFIGURACIÓN DE MULTER (Donde se guardan temporalmente los zips) ---
const upload = multer({ dest: 'uploads/' });

// --- MIDDLEWARES ---
app.use(cors()); 
app.use(express.json()); 

// --- SERVIDOR DE ARCHIVOS ESTÁTICOS ---
// Esto permite que el navegador vea los cursos descomprimidos
app.use('/cursos', express.static(path.join(__dirname, 'public/cursos')));

// --- RUTA DE PRUEBA DE CONEXIÓN ---
app.get('/test', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS resultado');
        res.json({ mensaje: 'Conexión a BD exitosa', resultado: rows[0].resultado });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error conectando a BD', error });
    }
});

// --- RUTA 1: OBTENER CURSOS (GET) ---
app.get('/api/cursos', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM cursos'); 
    res.json(results);
  } catch (err) {
    console.error('Error al leer cursos:', err);
    res.status(500).send('Error en la base de datos');
  }
});

// --- RUTA 2: SUBIR CURSO (MEJORADA) ---
app.post('/upload', upload.single('file'), async (req, res) => {
    console.log('--- Iniciando subida de curso ---');
    
    if (!req.file) {
        return res.status(400).send('No se subió ningún archivo.');
    }

    try {
        const { titulo, descripcion } = req.body;
        const zipPath = req.file.path;
        const folderName = 'scorm-' + Date.now();
        const extractPath = path.join(__dirname, 'public/cursos', folderName);
        
        // 1. Descomprimir
        console.log('Descomprimiendo en:', extractPath);
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractPath, true);

        // 2. Lógica inteligente para encontrar el archivo de inicio
        const files = fs.readdirSync(extractPath);
        const posiblesEntradas = ['index.html', 'story.html', 'player.html', 'Playing.html', 'launcher.html'];
        
        // A) Buscamos en la raíz
        let puntoEntrada = files.find(f => posiblesEntradas.includes(f)) || files.find(f => f.endsWith('.html'));

        // B) Si no está en la raíz, buscamos si hay una carpeta dentro (Efecto Matrioska)
        if (!puntoEntrada) {
            const carpetas = files.filter(f => fs.statSync(path.join(extractPath, f)).isDirectory());
            
            // Si hay carpetas, miramos dentro de la primera que encontremos
            if (carpetas.length > 0) {
                const subCarpeta = carpetas[0];
                const rutaSubCarpeta = path.join(extractPath, subCarpeta);
                const subFiles = fs.readdirSync(rutaSubCarpeta);
                
                const subEntrada = subFiles.find(f => posiblesEntradas.includes(f)) || subFiles.find(f => f.endsWith('.html'));
                
                if (subEntrada) {
                    console.log(`🔍 Encontrado dentro de subcarpeta: ${subCarpeta}`);
                    // Guardamos la ruta combinada: "NombreCarpeta/index.html"
                    puntoEntrada = subCarpeta + '/' + subEntrada; 
                }
            }
        }

        // C) Fallback final
        if (!puntoEntrada) {
            puntoEntrada = 'index.html'; 
            console.warn('⚠️ No se encontró HTML ni en raíz ni en subcarpetas. Usando default.');
        }

        // 3. Guardar en BD
        const rutaRelativa = '/cursos/' + folderName; 
        const query = 'INSERT INTO cursos (titulo, descripcion, ruta_carpeta, punto_entrada) VALUES (?, ?, ?, ?)';
        await db.query(query, [titulo, descripcion, rutaRelativa, puntoEntrada]);

        console.log('✅ Curso guardado con punto de entrada:', puntoEntrada);
        
        // 4. Limpieza
        fs.unlinkSync(zipPath);

        res.json({ message: 'Curso subido correctamente' });

    } catch (err) {
        console.error('❌ ERROR:', err);
        res.status(500).send('Error al procesar el curso: ' + err.message);
    }
});

// --- RUTA 3: LOGIN (¡Esto es lo que faltaba!) ---
app.post('/api/login', async (req, res) => {
    const { email } = req.body;
    console.log('🔑 Intento de login:', email); 

    try {
        // Buscamos si el email existe en la tabla 'usuarios'
        const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);

        if (rows.length > 0) {
            // ¡Usuario encontrado!
            res.json(rows[0]);
        } else {
            // No existe el usuario -> Devolvemos error 404
            console.log('Usuario no encontrado');
            res.status(404).json({ message: 'Usuario no encontrado' });
        }
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ message: 'Error en el servidor o falta la tabla usuarios' });
    }
});

// --- INICIAR SERVIDOR ---
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📂 Carpeta pública: ${path.join(__dirname, 'public/cursos')}`);
});