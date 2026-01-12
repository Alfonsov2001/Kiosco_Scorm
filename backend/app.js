const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const AdmZip = require('adm-zip');
const db = require('./src/config/db');

const app = express();
const PORT = 3000;

// --- CONFIGURACIÓN ---
const upload = multer({ dest: 'uploads/' });
app.use(cors());
// AUMENTAMOS EL LÍMITE A 1GB (por si acaso los vídeos pesan mucho)
app.use(express.json({ limit: '1000mb' }));
app.use(express.urlencoded({ limit: '1000mb', extended: true }));

app.use('/cursos', express.static(path.join(__dirname, 'public/cursos')));

// =========================================================================
//  FUNCIÓN 1: BUSCAR HTMLs RECURSIVAMENTE
// =========================================================================
const getHtmlFiles = (dirPath, arrayOfFiles = [], rootDir = '') => {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
        if (file.startsWith('.') || file.startsWith('__MACOSX')) return;

        const fullPath = path.join(dirPath, file);
        try {
            if (fs.statSync(fullPath).isDirectory()) {
                getHtmlFiles(fullPath, arrayOfFiles, rootDir || dirPath);
            } else {
                if (file.endsWith('.html') || file.endsWith('.htm')) {
                    const relativePath = path.relative(rootDir || dirPath, fullPath);
                    arrayOfFiles.push(relativePath.split(path.sep).join('/'));
                }
            }
        } catch (err) {}
    });
    return arrayOfFiles;
};

// =========================================================================
//  FUNCIÓN 2: DESCOMPRIMIR ZIPS INTERNOS (La Solución Matrioska)
// =========================================================================
const extractInternalZips = (dirPath) => {
    const files = fs.readdirSync(dirPath);
    let zipsFound = false;

    files.forEach(file => {
        if (file.endsWith('.zip')) {
            zipsFound = true;
            console.log(`🎁 Encontrado paquete interno: ${file}. Descomprimiendo...`);
            
            const zipFilePath = path.join(dirPath, file);
            // Creamos una carpeta con el mismo nombre del zip (ej: ud01)
            const folderName = path.parse(file).name; 
            const targetPath = path.join(dirPath, folderName);

            try {
                const zip = new AdmZip(zipFilePath);
                zip.extractAllTo(targetPath, true);
                
                // Borramos el zip comprimido para ahorrar espacio y no confundir
                fs.unlinkSync(zipFilePath); 
                console.log(`✅ ${file} descomprimido en carpeta /${folderName}`);
            } catch (e) {
                console.warn(`⚠️ Error al descomprimir ${file}:`, e.message);
            }
        }
    });
    return zipsFound;
};

// =========================================================================
//  RUTAS
// =========================================================================

app.get('/test', (req, res) => res.json({ status: 'OK' }));

app.get('/api/cursos', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM cursos');
        res.json(results);
    } catch (err) {
        res.status(500).send('Error BD');
    }
});

// --- SUBIDA DE CURSO "MATRIOSKA" ---
app.post('/upload', upload.single('file'), async (req, res) => {
    console.log('\n--- 🚀 INICIANDO SUBIDA DE CURSO COMPLEJO ---');

    if (!req.file) return res.status(400).send('Falta el archivo');

    const zipPath = req.file.path;
    
    try {
        const { titulo, descripcion } = req.body;
        const folderName = 'scorm-' + Date.now();
        const extractPath = path.join(__dirname, 'public/cursos', folderName);

        // 1. DESCOMPRESIÓN NIVEL 1 (La capa externa)
        console.log('📦 1. Descomprimiendo archivo principal...');
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractPath, true);

        // 2. DESCOMPRESIÓN NIVEL 2 (Buscar Zips internos como ud01.zip)
        console.log('🔍 2. Buscando paquetes internos (ud01, ud02...)...');
        extractInternalZips(extractPath);

        // 3. BUSCAR HTML (Ahora sí encontrará los que estaban dentro de ud01)
        console.log('📄 3. Escaneando HTMLs...');
        const todosLosHtml = getHtmlFiles(extractPath, [], extractPath);
        console.log(`   -> Encontrados: ${todosLosHtml.length} archivos HTML.`);

        if (todosLosHtml.length === 0) {
            throw new Error('NO SE ENCONTRÓ NINGÚN HTML (ni en raíz ni en zips internos).');
        }

        // 4. ELEGIR EL MEJOR HTML
        let puntoEntrada = '';
        const prioritarios = ['index.html', 'story.html', 'player.html', 'launcher.html'];

        // A) Buscar un index.html en la raíz
        puntoEntrada = todosLosHtml.find(f => prioritarios.includes(f));
        
        // B) Buscar index.html dentro de carpetas (ej: ud01/index.html)
        if (!puntoEntrada) {
            puntoEntrada = todosLosHtml.find(f => {
                const nombre = f.split('/').pop();
                return prioritarios.includes(nombre);
            });
        }

        // C) Cualquiera
        if (!puntoEntrada) puntoEntrada = todosLosHtml[0];

        console.log('🎯 Punto de entrada final:', puntoEntrada);

        // 5. GUARDAR BD
        const rutaRelativa = '/cursos/' + folderName;
        await db.query('INSERT INTO cursos (titulo, descripcion, ruta_carpeta, punto_entrada) VALUES (?, ?, ?, ?)', 
            [titulo, descripcion, rutaRelativa, puntoEntrada]);

        // 6. LIMPIEZA
        fs.unlinkSync(zipPath);
        console.log('✅ PROCESO COMPLETADO CON ÉXITO.');

        res.json({ message: 'Curso subido correctamente' });

    } catch (err) {
        console.error('❌ ERROR:', err);
        if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
        res.status(500).send('Error: ' + err.message);
    }
});

app.post('/api/login', async (req, res) => {
    const { email } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (rows.length > 0) res.json(rows[0]);
        else res.status(404).json({ message: 'Usuario no encontrado' });
    } catch (error) {
        res.status(500).json({ message: 'Error server' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 SERVIDOR LISTO EN PUERTO ${PORT}`);
});