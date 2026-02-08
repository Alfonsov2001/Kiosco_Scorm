-- Configuración inicial
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- --------------------------------------------------------
-- CREACIÓN DE LA BASE DE DATOS
-- --------------------------------------------------------

CREATE DATABASE IF NOT EXISTS `kiosco_scorm` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `kiosco_scorm`;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorias`
--

CREATE TABLE `categorias` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `imagen_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `categorias`
--

INSERT INTO `categorias` (`id`, `nombre`, `imagen_url`, `created_at`) VALUES
(1, 'Prevencion', NULL, '2026-01-25 15:45:48'),
(2, 'Calidad', NULL, '2026-01-25 15:45:48'),
(3, 'Inglés', NULL, '2026-01-25 15:45:48'),
(4, 'Programación', NULL, '2026-01-25 15:45:48'),
(5, 'Informatica', NULL, '2026-02-01 13:33:33');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cursos`
--

CREATE TABLE `cursos` (
  `id` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `ruta_carpeta` varchar(255) NOT NULL,
  `punto_entrada` varchar(255) NOT NULL,
  `fecha_subida` datetime DEFAULT current_timestamp(),
  `categoria_id` int(11) DEFAULT NULL,
  `imagen_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `cursos`
--

INSERT INTO `cursos` (`id`, `titulo`, `descripcion`, `ruta_carpeta`, `punto_entrada`, `fecha_subida`, `categoria_id`, `imagen_url`) VALUES
(38, 'Proteccion frente a Phising', 'Este curso está diseñado para dotar a los empleados de las habilidades necesarias para identificar, resistir y reportar intentos de ciberataques basados en ingeniería social.', '/cursos/scorm-1770556060509', 'scormdriver/indexAPI.html', '2026-02-08 14:07:46', 5, '/uploads/imagenes/img-1770556060506.jpg'),
(39, 'Evitar conflictos de intereses', 'Este curso proporciona el marco necesario para comprender cómo los intereses personales, financieros o familiares pueden influir —o parecer influir— en la toma de decisiones profesionales.', '/cursos/scorm-1770556238274', 'content/index.html', '2026-02-08 14:10:39', 2, '/uploads/imagenes/img-1770556238272.jpg');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `progreso`
--

CREATE TABLE `progreso` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `curso_id` int(11) NOT NULL,
  `cmi_lesson_status` varchar(50) DEFAULT 'not attempted',
  `cmi_score_raw` float DEFAULT 0,
  `cmi_location` varchar(255) DEFAULT '',
  `cmi_suspend_data` text DEFAULT NULL,
  `fecha_actualizacion` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `rol` enum('alumno','profesor') DEFAULT 'alumno',
  `fecha_registro` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `email`, `rol`, `fecha_registro`) VALUES
(1, 'paco@ejemplo.com', 'alumno', '2026-01-14 19:27:18'),
(2, 'pppppp', 'alumno', '2026-01-14 23:20:40'),
(3, 'ppppp', 'alumno', '2026-01-14 23:21:30'),
(4, 'paco@xxxx.com', 'alumno', '2026-01-15 00:08:02'),
(5, 'usuario@ejemplo.com', 'profesor', '2026-01-25 14:07:08'),
(6, 'profesor@ejemplo.com', 'profesor', '2026-01-25 14:33:10'),
(7, 'alumno@ejemplo.com', 'alumno', '2026-01-25 17:00:35'),
(8, 'invitado@ejemplo.com', 'alumno', '2026-02-01 20:23:45'),
(9, 'profesor@alumno.es', 'alumno', '2026-02-01 20:24:00'),
(10, 'alumno2@ejemplo.com', 'profesor', '2026-02-02 12:31:56'),
(11, 'ooooo@ejemplo.com', 'alumno', '2026-02-04 11:30:18'),
(12, 'profe2@ejemplo.com', 'profesor', '2026-02-04 12:03:58');

-- --------------------------------------------------------

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`),
  ADD UNIQUE KEY `uq_categorias_nombre` (`nombre`);

--
-- Indices de la tabla `cursos`
--
ALTER TABLE `cursos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_cursos_categoria` (`categoria_id`);

--
-- Indices de la tabla `progreso`
--
ALTER TABLE `progreso`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario_id` (`usuario_id`,`curso_id`),
  ADD KEY `curso_id` (`curso_id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `cursos`
--
ALTER TABLE `cursos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT de la tabla `progreso`
--
ALTER TABLE `progreso`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=738;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `cursos`
--
ALTER TABLE `cursos`
  ADD CONSTRAINT `fk_cursos_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `progreso`
--
ALTER TABLE `progreso`
  ADD CONSTRAINT `progreso_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  ADD CONSTRAINT `progreso_ibfk_2` FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

```