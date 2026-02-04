const axios = require('axios');
const fs = require('fs');

async function testDownload() {
    try {
        const cursoId = 16; // ddfsgvff, which exists
        console.log(`Intentando descargar curso ${cursoId}...`);
        const response = await axios.get(`http://localhost:3000/api/cursos/${cursoId}/descargar`, {
            responseType: 'arraybuffer'
        });

        console.log('Respuesta recibida. Status:', response.status);
        console.log('Headers:', response.headers);

        fs.writeFileSync('test_download_result.zip', response.data);
        console.log('ZIP guardado como test_download_result.zip. Tamaño:', response.data.length);
    } catch (error) {
        if (error.response) {
            console.error('Error del servidor:', error.response.status, error.response.data.toString());
        } else {
            console.error('Error:', error.message);
        }
    }
}

testDownload();
