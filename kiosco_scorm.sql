-- Configuración inicial
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------
-- CREACIÓN DE LA BASE DE DATOS
-- --------------------------------------------------------

CREATE DATABASE IF NOT EXISTS `kiosco_scorm` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `kiosco_scorm`;

-- --------------------------------------------------------
-- Estructura de tabla para la tabla `categorias`
-- --------------------------------------------------------

CREATE TABLE `categorias` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `imagen_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`),
  UNIQUE KEY `uq_categorias_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `categorias` (`id`, `nombre`, `imagen_url`, `created_at`) VALUES
(1, 'Prevencion', NULL, '2026-01-25 15:45:48'),
(2, 'Calidad', NULL, '2026-01-25 15:45:48'),
(3, 'Inglés', NULL, '2026-01-25 15:45:48'),
(4, 'Programación', NULL, '2026-01-25 15:45:48'),
(5, 'Informatica', NULL, '2026-02-01 13:33:33');

-- --------------------------------------------------------
-- Estructura de tabla para la tabla `usuarios`
-- --------------------------------------------------------

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `rol` enum('alumno','profesor') DEFAULT 'alumno',
  `fecha_registro` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `usuarios` (`id`, `email`, `rol`, `fecha_registro`) VALUES
(1, 'paco@ejemplo.com', 'alumno', '2026-01-14 19:27:18'),
(2, 'pppppp', 'alumno', '2026-01-14 23:20:40'),
(5, 'usuario@ejemplo.com', 'profesor', '2026-01-25 14:07:08'),
(6, 'profesor@ejemplo.com', 'profesor', '2026-01-25 14:33:10'),
(7, 'alumno@ejemplo.com', 'alumno', '2026-01-25 17:00:35');

-- --------------------------------------------------------
-- Estructura de tabla para la tabla `cursos`
-- --------------------------------------------------------

CREATE TABLE `cursos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `ruta_carpeta` varchar(255) NOT NULL,
  `punto_entrada` varchar(255) NOT NULL,
  `fecha_subida` datetime DEFAULT current_timestamp(),
  `categoria_id` int(11) DEFAULT NULL,
  `imagen_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_cursos_categoria` (`categoria_id`),
  CONSTRAINT `fk_cursos_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `cursos` (`id`, `titulo`, `descripcion`, `ruta_carpeta`, `punto_entrada`, `fecha_subida`, `categoria_id`, `imagen_url`) VALUES
(38, 'Proteccion frente a Phising', 'Identificar y resistir ciberataques.', '/cursos/scorm-1770556060509', 'scormdriver/indexAPI.html', '2026-02-08 14:07:46', 5, '/uploads/imagenes/img-1770556060506.jpg'),
(39, 'Evitar conflictos de intereses', 'Marco de decisiones profesionales.', '/cursos/scorm-1770556238274', 'content/index.html', '2026-02-08 14:10:39', 2, '/uploads/imagenes/img-1770556238272.jpg');

-- --------------------------------------------------------
-- Estructura de tabla para la tabla `progreso`
-- --------------------------------------------------------

CREATE TABLE `progreso` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `curso_id` int(11) NOT NULL,
  `cmi_lesson_status` varchar(50) DEFAULT 'not attempted',
  `cmi_score_raw` float DEFAULT 0,
  `cmi_location` varchar(255) DEFAULT '',
  `cmi_suspend_data` text DEFAULT NULL,
  `fecha_actualizacion` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_id` (`usuario_id`,`curso_id`),
  KEY `curso_id` (`curso_id`),
  CONSTRAINT `progreso_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `progreso_ibfk_2` FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

COMMIT;