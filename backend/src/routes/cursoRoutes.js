const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const cursoController = require('../controllers/cursoController');

console.log('--- Cargando cursoRoutes.js ---');
console.log('Configurando upload.fields con [file] e [imagen]');

// Configuración de almacenamiento temporal
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Si es imagen, va a uploads/imagenes, si es zip va a uploads/
        if (file.fieldname === 'imagen') {
            cb(null, path.join(__dirname, '../../uploads/imagenes'));
        } else {
            cb(null, path.join(__dirname, '../../uploads'));
        }
    },
    filename: (req, file, cb) => {
        const unico = Date.now();
        const extension = path.extname(file.originalname);
        if (file.fieldname === 'imagen') {
            cb(null, `img-${unico}${extension}`);
        } else {
            cb(null, `scorm-${unico}.zip`);
        }
    }
});

const upload = multer({ storage: storage });

// DEFINICIÓN DE RUTAS

// POST /api/cursos/upload - Usamos any() temporalmente para depurar
router.post('/upload', upload.any(), cursoController.subirCurso);

// GET /api/cursos
router.get('/', cursoController.obtenerCursos);

// GET /api/cursos/:id
router.get('/:id', cursoController.obtenerCurso);
router.delete('/:id', cursoController.eliminarCurso);
router.get('/:id/descargar', cursoController.descargarCurso);

// POST /api/cursos/login (Aunque login suele estar en authRoutes, lo dejaremos aqui por ahora o lo movemos a /api/login en app.js)
// Para mantener compatibilidad si el frontend llama a /api/login, lo montaremos en app.js aparte o redirigimos.
// El frontend llama a /api/login. Si montamos este router en /api/cursos, seria /api/cursos/login.
// Mejor separar auth o montar login en app.js usando el controller.
// Pero para ser estrictos MVC, deberíamos tener authController o usuarioController.
// Por simplicidad, añadiremos la ruta de login aquí pero SABIENDO que la montaremos en /api/cursos/login?
// No, el frontend llama a /api/login.
// Entonces en app.js definiremos: app.post('/api/login', cursoController.loginUsuario);
// Y aquí dejaremos solo lo de cursos.

module.exports = router;
