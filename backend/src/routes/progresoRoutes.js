const express = require('express');
const router = express.Router();
const progresoController = require('../controllers/progresoController');

// POST /api/progreso/guardar
router.post('/guardar', progresoController.guardarProgreso);

// GET /api/progreso/obtener
router.get('/obtener', progresoController.obtenerProgreso);

// GET /api/progreso/recientes
router.get('/recientes', progresoController.obtenerRecientes);

// NUEVO: GET /api/progreso/todos
router.get('/todos', progresoController.obtenerTodos);

module.exports = router;
