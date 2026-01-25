const express = require('express');
const router = express.Router();
const progresoController = require('../controllers/progresoController');

router.post('/guardar', progresoController.guardarProgreso);
router.get('/obtener', progresoController.obtenerProgreso);
router.get('/recientes', progresoController.obtenerRecientes);

module.exports = router;
