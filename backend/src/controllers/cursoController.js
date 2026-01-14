const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const xml2js = require('xml2js');
const Curso = require('../models/Curso');
const Usuario = require('../models/Usuario');
const { getHtmlFiles, extractInternalZips } = require('../utils/fileHelper');

exports.subirCurso = async (req, res) => {
    try {
        console.log('\n--- 🚀 INICIANDO SUBIDA DE CURSO (MVC) ---');
        if (!req.file) {
            return res.status(400).json({ mensaje: 'No se subió ningún archivo' });
        }

        const zipPath = req.file.path;
        const nombreCarpeta = 'scorm-' + Date.now();
        // Ajustamos la ruta para que coincida con donde backend/app.js sirve los estáticos
        // Estamos en backend/src/controllers -> ../../public/cursos
        const rutaDescompresion = path.join(__dirname, '../../public/cursos', nombreCarpeta);

        // 1. Descomprimir el ZIP
        console.log('📦 1. Descomprimiendo archivo principal...');
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(rutaDescompresion, true);

        // 2. Buscando paquetes internos
        console.log('🔍 2. Buscando paquetes internos...');
        extractInternalZips(rutaDescompresion);

        // 3. ESTRATEGIA MIXTA: PRIMERO SCORM MANIFEST, LUEGO BRUTE FORCE
        let puntoEntrada = '';
        const rutaManifest = path.join(rutaDescompresion, 'imsmanifest.xml');

        if (fs.existsSync(rutaManifest)) {
            console.log('📜 Manifest encontrado. Intentando parsear SCORM...');
            try {
                const xmlContent = fs.readFileSync(rutaManifest, 'utf-8');
                const parser = new xml2js.Parser();
                const result = await parser.parseStringPromise(xmlContent);
                const resources = result.manifest.resources[0].resource;
                const resourcePrincipal = resources.find(r => r.$ && r.$.href);
                if (resourcePrincipal) {
                    puntoEntrada = resourcePrincipal.$.href;
                    console.log('✅ SCORM Entry Point encontrado en manifest:', puntoEntrada);
                }
            } catch (err) {
                console.warn('⚠️ Error parseando manifest, probando fuerza bruta...', err.message);
            }
        }

        if (!puntoEntrada) {
            console.log('🕵️‍♂️ Manifest no útil o inexistente. Usando búsqueda heurística de HTMLs...');
            const todosLosHtml = getHtmlFiles(rutaDescompresion, [], rutaDescompresion);

            if (todosLosHtml.length === 0) {
                // Limpieza en error
                fs.rmSync(rutaDescompresion, { recursive: true, force: true });
                fs.unlinkSync(zipPath);
                return res.status(400).json({ mensaje: 'NO SE ENCONTRÓ NINGÚN HTML (ni en raíz ni en zips internos).' });
            }

            const prioritarios = ['index.html', 'story.html', 'player.html', 'launcher.html'];

            // A) Buscar un index.html en la raíz
            puntoEntrada = todosLosHtml.find(f => prioritarios.includes(f));

            // B) Buscar index.html dentro de carpetas
            if (!puntoEntrada) {
                puntoEntrada = todosLosHtml.find(f => {
                    const nombre = f.split('/').pop();
                    return prioritarios.includes(nombre);
                });
            }

            // C) Cualquiera
            if (!puntoEntrada) puntoEntrada = todosLosHtml[0];
            console.log('🎯 Punto de entrada encontrado por heurística:', puntoEntrada);
        }

        // 4. Guardar en BD usando MODELO
        const rutaWeb = `/cursos/${nombreCarpeta}`;
        const nuevoCurso = await Curso.create({
            titulo: req.body.titulo || nombreCarpeta,
            descripcion: req.body.descripcion || 'Curso SCORM subido',
            ruta_carpeta: rutaWeb,
            punto_entrada: puntoEntrada
        });

        // 5. Limpieza zip original
        fs.unlinkSync(zipPath);

        res.json({
            mensaje: 'Curso subido correctamente',
            cursoId: nuevoCurso.insertId
        });

    } catch (error) {
        console.error('❌ ERROR:', error);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ mensaje: 'Error procesando el curso', error: error.message });
    }
};

exports.obtenerCursos = async (req, res) => {
    try {
        const cursos = await Curso.getAll();
        res.json(cursos);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error obteniendo cursos' });
    }
};

exports.loginUsuario = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ mensaje: 'Email requerido' });

    try {
        let usuario = await Usuario.findByEmail(email);

        if (!usuario) {
            usuario = await Usuario.create({ email });
        }

        res.json(usuario);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error en login', error });
    }
};
