const express = require('express');
const router = express.Router();
const cursoController = require('../controllers/cursoController');

// POST /api/login
router.post('/login', cursoController.loginUsuario);

module.exports = router;
