#!/usr/bin/env node

/**
 * Script para inyectar el adaptador SCORM en todos los archivos index.html
 * Este script busca todos los archivos HTML en subdirectorios de cursos/ 
 * y añade el código de inicialización SCORM si no lo tiene
 */

const fs = require('fs');
const path = require('path');

const SCORM_ADAPTER = `    <!-- 🆕 INYECCIÓN DE SCORM ADAPTER -->
    <script type="text/javascript">
      (function() {
        console.log('🔧 INYECCIÓN SCORM: Buscando API SCORM...');
        
        // Función para encontrar y usar la API SCORM
        function initScormAdapter() {
          var scormAPI = null;
          var isInitialized = false;
          
          // Buscar API SCORM 1.2
          if (window.parent && window.parent.API) {
            scormAPI = window.parent.API;
            console.log('✅ API SCORM 1.2 encontrada en window.parent.API');
          } else if (window.API) {
            scormAPI = window.API;
            console.log('✅ API SCORM 1.2 encontrada en window.API');
          }
          
          // Buscar API SCORM 2004
          if (!scormAPI && window.parent && window.parent.API_1484_11) {
            scormAPI = window.parent.API_1484_11;
            console.log('✅ API SCORM 2004 encontrada en window.parent.API_1484_11');
          } else if (!scormAPI && window.API_1484_11) {
            scormAPI = window.API_1484_11;
            console.log('✅ API SCORM 2004 encontrada en window.API_1484_11');
          }
          
          if (scormAPI) {
            console.log('🚀 Inicializando SCORM...');
            
            // SCORM 1.2
            if (scormAPI.LMSInitialize) {
              scormAPI.LMSInitialize('');
              isInitialized = true;
              console.log('✅ LMSInitialize ejecutado');
            }
            
            // SCORM 2004
            if (!isInitialized && scormAPI.Initialize) {
              scormAPI.Initialize('');
              isInitialized = true;
              console.log('✅ Initialize (SCORM 2004) ejecutado');
            }
            
            if (isInitialized) {
              console.log('🎉 SCORM inicializado exitosamente');
              
              // Reportar que el curso está en progreso
              setTimeout(() => {
                if (scormAPI.LMSSetValue) {
                  scormAPI.LMSSetValue('cmi.core.lesson_status', 'incomplete');
                  console.log('📊 Estado establecido a: incomplete');
                }
                if (scormAPI.SetValue) {
                  scormAPI.SetValue('cmi.completion_status', 'incomplete');
                  console.log('📊 Estado (2004) establecido a: incomplete');
                }
              }, 500);
            }
          } else {
            console.warn('⚠️ No se encontró API SCORM disponible');
          }
        }
        
        // Intentar inicializar inmediatamente
        initScormAdapter();
        
        // Reintentar cada 2 segundos por si la API está tardando en cargar
        var retryCount = 0;
        var retryInterval = setInterval(() => {
          if (retryCount < 10 && !window._scormInitialized) {
            initScormAdapter();
            retryCount++;
          } else {
            clearInterval(retryInterval);
          }
        }, 2000);
        
        window._scormInitialized = true;
      })();
    </script>
`;

const cursosDir = path.join(__dirname, 'public', 'cursos');

console.log('📁 Buscando archivos HTML en:', cursosDir);

// Listar todas las carpetas de cursos
fs.readdirSync(cursosDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .forEach(dirent => {
    const cursoDir = path.join(cursosDir, dirent.name);
    
    // Buscar archivos HTML en la carpeta
    searchAndInject(cursoDir);
  });

function searchAndInject(dir, depth = 0) {
  if (depth > 5) return; // Evitar profundidad infinita
  
  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
      const filePath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        searchAndInject(filePath, depth + 1);
      } else if (file.name.endsWith('.html')) {
        injectScormAdapter(filePath);
      }
    });
  } catch (e) {
    console.error('❌ Error leyendo directorio:', dir, e.message);
  }
}

function injectScormAdapter(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Verificar si ya tiene la inyección
    if (content.includes('INYECCIÓN DE SCORM ADAPTER')) {
      console.log('⏭️  Ya tiene inyección:', filePath);
      return;
    }
    
    // Encontrar donde inyectar (después del </head> o en el <head>)
    const headEnd = content.indexOf('</head>');
    const headStart = content.indexOf('<head');
    
    if (headEnd !== -1) {
      // Inyectar justo antes de </head>
      const newContent = content.slice(0, headEnd) + '\n' + SCORM_ADAPTER + '\n  ' + content.slice(headEnd);
      fs.writeFileSync(filePath, newContent, 'utf-8');
      console.log('✅ Inyectado en:', filePath);
    } else if (headStart !== -1) {
      // Si no hay </head>, inyectar después de <head>
      const headEndTag = content.indexOf('>', headStart);
      const newContent = content.slice(0, headEndTag + 1) + '\n' + SCORM_ADAPTER + '\n' + content.slice(headEndTag + 1);
      fs.writeFileSync(filePath, newContent, 'utf-8');
      console.log('✅ Inyectado en:', filePath);
    } else {
      console.warn('⚠️ No se encontró <head> en:', filePath);
    }
  } catch (e) {
    console.error('❌ Error procesando archivo:', filePath, e.message);
  }
}

console.log('✅ Proceso completado');
