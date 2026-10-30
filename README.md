# S&J-GEEK — Frontend Web

Interfaz web de la plataforma **S&J-GEEK**, desarrollada con HTML5, CSS3 y JavaScript puro (sin frameworks). Se conecta a la API REST del backend para gestionar el catálogo de películas, series y anime.

---

## Autoras

- **Stefani Fabiola Sánchez Pérez**
- **Jakelin Mishel Quino Martínez**

---

## Páginas

| Archivo | Descripción |
|---|---|
| `index.html` | Catálogo principal con búsqueda, filtros por tipo/género/clasificación y ordenamiento |
| `detalle.html` | Vista de detalle de una obra, reseñas, calificaciones y tráiler |
| `admin.html` | Panel de administración: aprobar propuestas, publicar obras y gestionar categorías |
| `login.html` | Inicio de sesión |
| `register.html` | Registro de nuevo usuario |

---

## Funcionalidades

- **Catálogo dinámico** con filtros en tiempo real (tipo, género, clasificación de edad, búsqueda por texto)
- **Ordenamiento** por popularidad, calificación, fecha o ranking bayesiano ponderado
- **Detalle de obra** con sinopsis, badges de tipo/género/clasificación, métricas y tráiler de YouTube
- **Sistema de reseñas** con calificación del 1 al 10 y reacciones like/dislike
- **Propuesta de obras** con autocompletado desde TMDb y opción de subir imagen desde el equipo
- **Panel de administración** con tres secciones: pendientes por aprobar, publicación directa con foto, y CRUD de categorías
- **Clasificación por edad**: TP (Todo Público), +13, +16, +18
- **Diseño oscuro** responsive, adaptado para escritorio y móvil

---

## Cómo ejecutar

### Opción 1: Live Server en VS Code
1. Abrir la carpeta `sj-geek-frontend` en VS Code
2. Clic derecho en `index.html` > "Open with Live Server"
3. Se abre en `http://127.0.0.1:5500`

### Opción 2: Servidor HTTP simple
```bash
# Con npx
npx serve -p 5000

# O con Python
python -m http.server 5000
```

---

## Conexión con el backend

La URL del backend se configura en `js/api.js`:
```javascript
const API_URL = 'http://localhost:3000/api';
```

El backend debe estar corriendo en el puerto 3000 antes de usar la aplicación.

---

## Estructura de archivos

```
sj-geek-frontend/
├── css/
│   └── styles.css      # Estilos generales (tema oscuro, tarjetas, badges, modal)
├── js/
│   ├── api.js           # Funciones de conexión con la API y TMDb
│   ├── auth.js          # Manejo de sesión y navegación dinámica
│   ├── home.js          # Lógica del catálogo, filtros y modal de propuesta
│   ├── detalle.js       # Vista de detalle, reseñas y reacciones
│   └── admin.js         # Panel de administración
├── index.html
├── detalle.html
├── admin.html
├── login.html
└── register.html
```
