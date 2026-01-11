const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const xml2js = require('xml2js');
const db = require('../config/db');

exports.subirCurso = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ mensaje: 'No se subió ningún archivo' });
        }

        // 1. Datos iniciales
        // req.file viene gracias a Multer (lo configuraremos en la ruta)
        const rutaZip = req.file.path;
        const nombreCarpeta = path.parse(req.file.filename).name; // Nombre único
        const rutaDescompresion = path.join(__dirname, '../../public/cursos', nombreCarpeta);

        // 2. Descomprimir el ZIP
        const zip = new AdmZip(rutaZip);
        zip.extractAllTo(rutaDescompresion, true);

        // 3. Buscar y leer el imsmanifest.xml
        const rutaManifest = path.join(rutaDescompresion, 'imsmanifest.xml');
        
        if (!fs.existsSync(rutaManifest)) {
            // Si no hay manifest, borramos todo porque no es un SCORM válido
            fs.rmSync(rutaDescompresion, { recursive: true, force: true });
            fs.unlinkSync(rutaZip); 
            return res.status(400).json({ mensaje: 'El archivo no es un paquete SCORM válido (falta imsmanifest.xml)' });
        }

        // 4. Parsear el XML para encontrar el archivo de inicio (launch file)
        const xmlContent = fs.readFileSync(rutaManifest, 'utf-8');
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(xmlContent);

        // NOTA: Navegar por el XML de SCORM es un poco feo.
        // Buscamos dentro de <resources> el primer <resource> que tenga un "href"
        const resources = result.manifest.resources[0].resource;
        let puntoEntrada = '';

        // Buscamos el primer recurso que sea 'webcontent' y tenga href
        const resourcePrincipal = resources.find(r => r.$ && r.$.href);
        
        if (resourcePrincipal) {
            puntoEntrada = resourcePrincipal.$.href;
        } else {
            // Fallback: si no encontramos nada obvio, buscamos index.html
            puntoEntrada = 'index.html';
        }

        // 5. Guardar en Base de Datos
        // La ruta que guardamos es RELATIVA para que Angular pueda acceder: /cursos/nombre-carpeta
        const rutaWeb = `/cursos/${nombreCarpeta}`;
        
        const [insertResult] = await db.query(
            'INSERT INTO cursos (titulo, descripcion, ruta_carpeta, punto_entrada) VALUES (?, ?, ?, ?)',
            [req.body.titulo || nombreCarpeta, 'Curso SCORM importado', rutaWeb, puntoEntrada]
        );

        // 6. Limpieza: Borrar el ZIP original (ya está descomprimido)
        fs.unlinkSync(rutaZip);

        res.json({
            mensaje: 'Curso subido y procesado con éxito',
            cursoId: insertResult.insertId,
            ruta: rutaWeb,
            inicio: puntoEntrada
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error procesando el curso', error: error.message });
    }
};

// Función extra para listar cursos (nos servirá luego)
exports.obtenerCursos = async (req, res) => {
    try {
        const [cursos] = await db.query('SELECT * FROM cursos');
        res.json(cursos);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error obteniendo cursos' });
    }
};

exports.loginUsuario = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ mensaje: 'Email requerido' });

    try {
        // Buscamos si existe
        let [users] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        
        if (users.length === 0) {
            // Si no existe, lo creamos automáticamente (Login sin registro previo)
            const [result] = await db.query('INSERT INTO usuarios (email) VALUES (?)', [email]);
            users = [{ id: result.insertId, email: email }];
        }

        // Devolvemos el usuario
        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error en login', error });
    }
};