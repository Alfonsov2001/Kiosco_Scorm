const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const cursoController = require('../controllers/cursoController');

// Configuración de almacenamiento temporal
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Guardamos en backend/uploads
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        const unico = Date.now();
        cb(null, `scorm-${unico}.zip`);
    }
});

const upload = multer({ storage: storage });

// DEFINICIÓN DE RUTAS

// POST /api/cursos/upload
router.post('/upload', upload.single('file'), cursoController.subirCurso);

// GET /api/cursos
router.get('/', cursoController.obtenerCursos);

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
