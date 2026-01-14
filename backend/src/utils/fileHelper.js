const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

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
        } catch (err) {
            // Ignorar errores de acceso
        }
    });
    return arrayOfFiles;
};

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

module.exports = {
    getHtmlFiles,
    extractInternalZips
};
