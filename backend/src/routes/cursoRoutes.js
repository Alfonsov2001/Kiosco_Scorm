const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const cursoController = require('../controllers/cursoController');

// Configuración de almacenamiento temporal para el ZIP
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Guardamos temporalmente en la raíz o una carpeta temp
        cb(null, path.join(__dirname, '../../')); 
    },
    filename: (req, file, cb) => {
        // Usamos la fecha para evitar nombres duplicados: curso-163456789.zip
        const unico = Date.now();
        cb(null, `scorm-${unico}.zip`);
    }
});

const upload = multer({ storage: storage });

// DEFINICIÓN DE RUTAS
// POST /api/cursos/upload -> Sube el archivo
router.post('/upload', upload.single('scormZip'), cursoController.subirCurso);

// GET /api/cursos -> Lista los cursos disponibles
router.get('/', cursoController.obtenerCursos);
router.post('/login', cursoController.loginUsuario);
module.exports = router;