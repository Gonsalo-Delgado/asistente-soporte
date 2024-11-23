# Asistente Virtual de Soporte Técnico

## 📋 Tabla de Contenidos
- [Requisitos Previos](#requisitos-previos)
- [Configuración del Entorno](#configuración-del-entorno)
- [Configuración de APIs](#configuración-de-apis)
- [Firebase Setup](#firebase-setup)
- [Credenciales de Acceso](#credenciales-de-acceso)
- [Solución de Problemas](#solución-de-problemas)

## 🛠️ Requisitos Previos

### Versión de Python
- Python 3.12.5

### Dependencias Principales
```bash
pip install firebase-admin
pip install flask
pip install google-generativeai
pip install python-dotenv
pip install markdown
pip install bcrypt
pip install google-api-python-client
pip install google-auth google-auth-oauthlib google-auth-httplib2
```

## ⚙️ Configuración del Entorno

### Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
GEMINI_API_KEY=TU_CLAVE_DE_API
YOUTUBE_API_KEY=TU_CLAVE_DE_API
FIREBASE_ADMIN_SDK_CREDENTIALS=./firebase-adminsdk.json
FIREBASE_DATABASE_URL=https://<tu-proyecto>.firebaseio.com/
APP_SECRET_KEY=CLAVE_ALEATORIA
```

> ⚠️ **Importante**: Asegúrate de incluir el archivo `.env` en tu `.gitignore` para proteger tus credenciales.

### Descripción de Variables
| Variable | Descripción |
|----------|-------------|
| `GEMINI_API_KEY` | Clave para acceder al servicio de Gemini |
| `YOUTUBE_API_KEY` | Clave para la API de YouTube |
| `FIREBASE_ADMIN_SDK_CREDENTIALS` | Ruta al archivo JSON de credenciales de Firebase |
| `FIREBASE_DATABASE_URL` | URL de la base de datos en tiempo real de Firebase |
| `APP_SECRET_KEY` | Clave para cifrado y autenticación |

## 🔑 Configuración de APIs

### Gemini API
1. Visita [Google AI Studio](https://ai.google.dev/)
2. Selecciona "Obtén una clave de API"
3. Configura los permisos necesarios
4. Guarda la clave generada en tu archivo `.env`

### YouTube API
1. Accede a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita "YouTube Data API v3"
4. Genera una nueva clave de API en "Credentials"
5. Guarda la clave en tu archivo `.env`

## 🔥 Firebase Setup

### Configuración de Firebase Admin SDK
1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto
3. Navegua a Configuración del Proyecto > Cuentas de servicio
4. Genera una nueva clave privada
5. Guarda el archivo JSON descargado de forma segura

### Configuración de Realtime Database
1. En Firebase Console, ve a "Database"
2. Habilita Realtime Database
3. Importa la configuración inicial usando:
   - Archivo: `default-user.json`
   - Ruta: Menú tres puntos > Importar

## 👥 Credenciales de Acceso
```
Administrador: administrador2@_24
Usuario: usuario2@_24
```

## 🌐 Entorno Virtual

### Creación del Entorno
```bash
# Crear entorno virtual
python3.12 -m venv venv

# Activar entorno (Windows)
.\venv\Scripts\activate

# Activar entorno (macOS/Linux)
source venv/bin/activate
```

### Instalación de Dependencias
```bash
pip install -r requirements.txt
```

### Desactivar Entorno
```bash
deactivate
```

## ❗ Solución de Problemas

- **Python no encontrado**: Verifica que Python 3.12.5 esté instalado y en el PATH del sistema
- **Error en requirements.txt**: Si el archivo no existe, genera uno con `pip freeze > requirements.txt`
- **Problemas de conexión**: Verifica las credenciales y URLs en el archivo `.env`

## 📝 Notas Adicionales
- Mantén tus credenciales seguras
- No compartas archivos de configuración sensibles
- Actualiza regularmente las dependencias

## 🤝 Contribuir
Si deseas contribuir al proyecto, por favor:
1. Haz un Fork del repositorio
2. Crea una nueva rama para tus cambios
3. Envía un Pull Request con tus mejoras