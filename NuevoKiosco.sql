CREATE DATABASE IF NOT EXISTS kiosco_scorm;
USE kiosco_scorm;

-- 1. Tabla de Usuarios
-- Solo pedimos email, así que ese será nuestro identificador principal.
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Cursos SCORM
-- Aquí guardaremos la información del paquete que subas.
CREATE TABLE cursos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    ruta_carpeta VARCHAR(255) NOT NULL, -- Dónde descomprimimos el ZIP en el servidor
    punto_entrada VARCHAR(255) NOT NULL, -- El archivo .html que arranca el curso (sacado del manifest)
    fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Progreso (La más técnica)
-- SCORM guarda datos llamados "cmi" (suspenso/aprobado, tiempo, location, etc.)
CREATE TABLE progreso (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    curso_id INT NOT NULL,
    cmi_lesson_status VARCHAR(50) DEFAULT 'not attempted', -- completed, incomplete, passed, failed
    cmi_score_raw FLOAT DEFAULT 0, -- Nota del examen si lo hay
    cmi_location VARCHAR(255) DEFAULT '', -- "Bookmark" de dónde se quedó el usuario
    cmi_suspend_data TEXT, -- Datos internos que el SCORM necesita para recordar el estado exacto
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (curso_id) REFERENCES cursos(id),
    -- Un usuario solo tiene un registro de progreso por curso
    UNIQUE(usuario_id, curso_id)
);