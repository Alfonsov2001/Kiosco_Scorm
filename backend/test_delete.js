require('dotenv').config();
const db = require('./src/config/db');
const Curso = require('./src/models/Curso');
const fs = require('fs');
const path = require('path');

async function testDelete(id) {
    console.log(`--- Test Deletion for ID: ${id} ---`);
    try {
        const curso = await Curso.getById(id);
        if (!curso) {
            console.error('Course not found in DB');
            return;
        }

        console.log(`Found course: ${curso.titulo}`);

        // Test DB delete directly
        await Curso.delete(id);
        console.log('✅ DB Delete success');

    } catch (e) {
        console.error('❌ Error testing delete:', e);
    } finally {
        process.exit();
    }
}

const idToDelete = process.argv[2] || 6;
testDelete(idToDelete);
