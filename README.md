# 🎓 Kiosco SCORM - Sistema de Gestión de Aprendizaje

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)
![Angular](https://img.shields.io/badge/Angular-21.0-red.svg)
![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg)

Kiosco de paquetes SCORM para que las instituciones educativas puedan ver los cursos antes de introducirlo en el LMS

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Endpoints](#-api-endpoints)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

## �?Características

### Para Profesores
- 📤 **Subida de Cursos SCORM**: Importación automática de paquetes SCORM 1.2 y 2004 en formato ZIP
- 📊 **Dashboard de Profesor**: Visualización del progreso de todos los estudiantes
- 🗂�?**Gestión de Categorías**: Organización de cursos por categorías personalizadas
- 📈 **Seguimiento de Progreso**: Monitoreo en tiempo real del avance de cada alumno
- 🔄 **Gestión de Cursos**: Crear, filtrar y eliminar cursos

### Para Estudiantes
- 🎯 **Catálogo de Cursos**: Navegación intuitiva por cursos disponibles
- 📚 **Reproductor SCORM**: Player integrado compatible con SCORM 1.2 y 2004
- 📊 **Seguimiento Personal**: Visualización del progreso individual en cada curso
- 💾 **Guardado Automático**: Persistencia automática del progreso y estado
- 🔐 **Perfil Personal**: Gestión de información de usuario

### Características Técnicas
- �?**SCORM 1.2 Compliant**: Implementación completa de la API SCORM 1.2
- �?**SCORM 2004 Compliant**: Implementación completa de la API SCORM 2004
- 🔒 **Sistema de Autenticación**: Login basado en email con roles (profesor/alumno)
- 📱 **Diseño Responsivo**: Interfaz adaptable a todos los dispositivos
- 🎨 **UI Moderna**: Diseño limpio con Bootstrap 5 y animaciones suaves
- 🚀 **Alto Rendimiento**: Optimizado para carga rápida y experiencia fluida

## 🛠�?Tecnologías

### Frontend
- **Angular 21**: Framework principal
- **TypeScript**: Lenguaje de programación
- **Bootstrap 5**: Framework CSS
- **Bootstrap Icons**: Biblioteca de iconos

### Backend
- **Node.js**: Entorno de ejecución
- **Express 5**: Framework web
- **MySQL 2**: Base de datos
- **Multer**: Gestión de uploads
- **AdmZip**: Procesamiento de archivos ZIP
- **xml2js**: Parsing de manifiestos SCORM

### Herramientas
- **XAMPP**: Entorno de desarrollo local
- **NPM**: Gestión de paquetes

## 📦 Requisitos Previos

Asegúrate de tener instalado lo siguiente:

- **Node.js** (v18 o superior) - [Descargar](https://nodejs.org/)
- **npm** (v10 o superior) - Incluido con Node.js
- **XAMPP** (con MySQL activo) - [Descargar](https://www.apachefriends.org/)
- **Git** - [Descargar](https://git-scm.com/)

## 🚀 Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/Alfonsov2001/Kiosco_Scorm.git
cd Kiosco_Scorm
```

### 2. Configurar la Base de Datos

1. Abre XAMPP y arranca **MySQL**
2. Accede a phpMyAdmin (http://localhost/phpmyadmin)
3. Importa el archivo SQL:

```bash
# Opción 1: Desde phpMyAdmin
# - Crear nueva base de datos (no necesario, el script la crea)
# - Importar el archivo kiosco_scorm.sql

# Opción 2: Desde terminal
mysql -u root -p < kiosco_scorm.sql
```

Esto creará:
- La base de datos `kiosco_scorm`
- Las tablas: `usuarios`, `categorias`, `cursos`, `progreso`
- Datos de ejemplo (usuarios de prueba, categorías)

### 3. Instalar Dependencias del Backend

```bash
cd backend
npm install
```

### 4. Configurar Variables de Entorno

Crea un archivo `.env` en la carpeta `backend`:

```env
# Puerto del servidor
PORT=3000

# Configuración de MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=kiosco_scorm
DB_PORT=3306
```

### 5. Instalar Dependencias del Frontend

```bash
cd ../frontend
npm install
```

## ⚙️ Configuración

### Backend

El backend ya está configurado para trabajar con XAMPP. Si necesitas modificar la configuración de la base de datos, edita el archivo `backend/src/config/database.js`.

### Frontend

El frontend utiliza un proxy para conectarse al backend. La configuración está en `frontend/proxy.conf.json`:

```json
{
  "/api/*": {
    "target": "http://localhost:3000",
    "secure": false,
    "logLevel": "debug",
    "changeOrigin": true
  }
}
```

## 🎯 Uso

### Iniciar el Backend

```bash
cd backend
node app.js
```

El servidor estará disponible en `http://localhost:3000`

### Iniciar el Frontend

```bash
cd frontend
npm start
```

El frontend estará disponible en `http://localhost:4200`

### Usuarios de Prueba

Puedes usar estos usuarios para probar la aplicación:

**Profesor:**
- Email: `profesor@ejemplo.com`, insertando la palabra "profesor" como password otorgado por el centro.

**Alumno:**
- Email: `alumno@ejemplo.com`

> **Nota**: El sistema solo requiere email (no contraseñas en la versión actual)

### Subir un Curso SCORM

1. Inicia sesión como **profesor**
2. Ve a **"Subir Curso"** en el menú
3. Completa el formulario:
   - Título del curso
   - Descripción
   - Categoría
   - Imagen de portada (JPG/PNG)
   - Archivo SCORM (ZIP)
4. Haz clic en **"Subir Curso"**

El sistema automáticamente:
- Descomprime el paquete SCORM
- Parsea el manifiesto `imsmanifest.xml`
- Identifica el punto de entrada (launcher)
- Almacena la información en la base de datos

### Reproducir un Curso

1. Como **alumno**, navega al catálogo de cursos
2. Selecciona un curso
3. Haz clic en **"Iniciar Curso"** o **"Continuar"**
4. El reproductor SCORM cargará el contenido
5. Tu progreso se guardará automáticamente

## 📁 Estructura del Proyecto

```
Kiosco_Scorm/
├── backend/                    # Servidor Node.js/Express
�?  ├── src/
�?  �?  ├── config/            # Configuración DB
�?  �?  ├── controllers/       # Lógica de negocio
�?  �?  ├── models/           # Modelos de datos
�?  �?  └── routes/           # Rutas de la API
�?  ├── public/               # Archivos estáticos
�?  �?  └── cursos/          # Cursos SCORM descomprimidos
�?  ├── uploads/             # Imágenes de cursos
�?  ├── app.js              # Punto de entrada
�?  └── package.json
�?
├── frontend/                  # Aplicación Angular
�?  ├── src/
�?  �?  ├── app/
�?  �?  �?  ├── components/
�?  �?  �?  �?  ├── dashboard/      # Dashboard de alumno
�?  �?  �?  �?  ├── header/         # Barra de navegación
�?  �?  �?  �?  ├── sidebar/        # Menú lateral
�?  �?  �?  �?  ├── login/          # Pantalla de login
�?  �?  �?  �?  ├── player/         # Reproductor SCORM
�?  �?  �?  �?  └── upload/         # Subida de cursos
�?  �?  �?  ├── pages/
�?  �?  �?  �?  └── dashboard-profesor/  # Vista profesor
�?  �?  �?  ├── services/
�?  �?  �?  �?  ├── data.service.ts      # Servicio HTTP
�?  �?  �?  �?  └── scorm.service.ts     # API SCORM
�?  �?  �?  ├── layout/                   # Layout general
�?  �?  �?  └── app.routes.ts            # Rutas
�?  �?  ├── assets/          # Recursos estáticos
�?  �?  └── styles/          # Estilos globales
�?  └── package.json
�?
├── kiosco_scorm.sql         # Script de base de datos
└── README.md               # Este archivo
```

## 🔌 API Endpoints

### Autenticación

```
POST   /api/login          - Iniciar sesión
POST   /api/register       - Registrar nuevo usuario
```

### Cursos

```
GET    /api/cursos         - Listar todos los cursos
GET    /api/cursos/:id     - Obtener curso específico
POST   /api/cursos         - Crear nuevo curso (solo profesor)
PUT    /api/cursos/:id     - Actualizar curso (solo profesor)
DELETE /api/cursos/:id     - Eliminar curso (solo profesor)
```

### Categorías

```
GET    /api/categorias     - Listar todas las categorías
POST   /api/categorias     - Crear nueva categoría (solo profesor)
```

### Progreso

```
GET    /api/progreso/:usuarioId/:cursoId  - Obtener progreso
POST   /api/progreso                       - Guardar progreso
PUT    /api/progreso/:usuarioId/:cursoId   - Actualizar progreso
POST   /api/progreso/reset                 - Reiniciar progreso
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Para contribuir:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Estándares de Código

- **Frontend**: Seguir las guías de estilo de Angular
- **Backend**: Usar ESLint para mantener consistencia
- **Commits**: Mensajes descriptivos en español
- **Documentación**: Comentar código complejo

## 📝 Notas Adicionales

### Compatibilidad SCORM

Este sistema soporta:
- �?SCORM 1.2
- �?SCORM 2004

### Seguridad

> ⚠️ **Nota Importante**: Esta versión es un prototipo educativo. Para producción, considera implementar:
> - Autenticación con contraseñas hash (bcrypt)
> - Tokens JWT para sesiones
> - Validación de inputs más robusta
> - HTTPS
> - Rate limiting
> - Sanitización de archivos subidos

### Rendimiento

Para optimizar en producción:
- Activar caché de archivos estáticos
- Comprimir respuestas (gzip)
- Optimizar consultas SQL con índices
- Implementar CDN para assets

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.

## 👥 Autores

**Alfonso Valenzuela Rivero**
**David Valdivia Guillén**
**Francisco García Partida**
**Javier Parreño Garrido**

## 📞 Soporte

Si encuentras algún problema o tienes sugerencias:
- Abre un [Issue](https://github.com/Alfonsov2001/Kiosco_Scorm/issues)
- Contacta al equipo de desarrollo

---

�?Si este proyecto te fue útil, considera darle una estrella en GitHub!
