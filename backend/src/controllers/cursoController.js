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
        console.log('Archivos recibidos (any):', req.files);

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ mensaje: 'No se subió ningún archivo' });
        }

        const zipFile = req.files.find(f => f.fieldname === 'file');
        const imagenFile = req.files.find(f => f.fieldname === 'imagen');

        if (!zipFile) {
            return res.status(400).json({ mensaje: 'Falta el archivo SCORM (field: file)' });
        }

        const zipPath = zipFile.path;
        const nombreCarpeta = 'scorm-' + Date.now();
        // Ajustamos la ruta para que coincida con donde backend/app.js sirve los estáticos
        const rutaDescompresion = path.join(__dirname, '../../public/cursos', nombreCarpeta);

        // 1. Descomprimir el ZIP
        console.log('📦 1. Descomprimiendo archivo principal en:', rutaDescompresion);
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(rutaDescompresion, true);
        console.log('✅ Descompresión completada.');

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

        console.log('💾 4. Guardando en BD...');
        const rutaWeb = `/cursos/${nombreCarpeta}`;
        const imagenUrl = imagenFile ? `/uploads/imagenes/${imagenFile.filename}` : null;

        const nuevoCurso = await Curso.create({
            titulo: req.body.titulo || nombreCarpeta,
            descripcion: req.body.descripcion || 'Curso SCORM subido',
            ruta_carpeta: rutaWeb,
            punto_entrada: puntoEntrada,
            categoria_id: req.body.categoria_id || null,
            imagen_url: imagenUrl
        });
        console.log('✅ Curso creado en BD. ID:', nuevoCurso.insertId);

        // 5. Limpieza zip original (usando zipPath que extrajimos de zipFile)
        if (fs.existsSync(zipPath)) {
            console.log('🧹 Limpiando archivo temporal:', zipPath);
            fs.unlinkSync(zipPath);
        }

        console.log('🏁 Enviando respuesta al cliente...');
        res.json({
            mensaje: 'Curso subido correctamente',
            cursoId: nuevoCurso.insertId
        });

    } catch (error) {
        console.error('❌ ERROR:', error);
        // Limpieza en caso de error
        if (req.files) {
            if (req.files['file'] && fs.existsSync(req.files['file'][0].path)) fs.unlinkSync(req.files['file'][0].path);
            if (req.files['imagen'] && fs.existsSync(req.files['imagen'][0].path)) fs.unlinkSync(req.files['imagen'][0].path);
        }
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

exports.obtenerCurso = async (req, res) => {
    const { id } = req.params;
    try {
        const curso = await Curso.getById(id);
        if (!curso) return res.status(404).json({ mensaje: 'Curso no encontrado' });
        res.json(curso);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error obteniendo curso' });
    }
};

exports.eliminarCurso = async (req, res) => {
    const { id } = req.params;
    console.log(`\n--- 🗑️ PETICIÓN DE ELIMINACIÓN: ID ${id} ---`);
    try {
        // 1. Obtener datos del curso para borrar archivos
        const curso = await Curso.getById(id);
        if (!curso) {
            console.log('❌ Curso no encontrado en BD');
            return res.status(404).json({ mensaje: 'Curso no encontrado' });
        }

        console.log(`   Curso: ${curso.titulo}`);

        // 2. Borrar carpeta de SCORM
        if (curso.ruta_carpeta) {
            const rutaAbsoluta = path.join(__dirname, '../../public', curso.ruta_carpeta);
            console.log('   Ruta SCORM:', rutaAbsoluta);
            if (fs.existsSync(rutaAbsoluta)) {
                try {
                    fs.rmSync(rutaAbsoluta, { recursive: true, force: true });
                    console.log('   ✅ Carpeta SCORM borrada');
                } catch (e) {
                    console.warn('   ⚠️ No se pudo borrar carpeta SCORM:', e.message);
                }
            } else {
                console.log('   ℹ️ La carpeta SCORM no existía físicamente');
            }
        }

        // 3. Borrar imagen si existe
        if (curso.imagen_url) {
            const rutaImagen = path.join(__dirname, '../../', curso.imagen_url);
            console.log('   Ruta Imagen:', rutaImagen);
            if (fs.existsSync(rutaImagen)) {
                try {
                    fs.unlinkSync(rutaImagen);
                    console.log('   ✅ Imagen borrada');
                } catch (e) {
                    console.warn('   ⚠️ No se pudo borrar imagen:', e.message);
                }
            } else {
                console.log('   ℹ️ La imagen no existía físicamente');
            }
        }

        // 4. Borrar de la base de datos
        console.log('   ⏳ Borrando de BD...');
        await Curso.delete(id);
        console.log('   ✅ Registro borrado de BD');

        res.json({ mensaje: 'Curso eliminado correctamente' });

    } catch (error) {
        console.error('❌ ERROR FATAL EN ELIMINACIÓN:', error);
        res.status(500).json({ mensaje: 'Error eliminando curso', error: error.message });
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
