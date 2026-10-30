const API_URL = 'http://localhost:3000/api';
const TMDB_API_KEY = 'TU_TMDB_API_KEY'; 
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });

        const json = await response.json();
        
        if (!response.ok) {
            let errorMsg = json.message || 'Error en la solicitud al servidor';
            if (json.errors && Array.isArray(json.errors)) {
                errorMsg += ': ' + json.errors.map(e => e.message || e.msg).join(', ');
            }
            throw new Error(errorMsg);
        }
        
        // Si el backend responde con standard response format: { status, data, message }
        if (json && json.data !== undefined) {
            // Si data contiene token y user, enriquecemos para compatibilidad directa
            if (json.data && json.data.token && json.data.user) {
                return {
                    ...json.data,
                    rol: json.data.user.rol,
                    usuario_id: json.data.user.id,
                    nombre: json.data.user.nombre,
                    email: json.data.user.email
                };
            }
            return json.data;
        }

        return json;
    } catch (error) {
        console.error('Error API:', error);
        throw error;
    }
}

// Subir archivo de imagen/foto al backend
async function apiUpload(file) {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('foto', file);

    const headers = {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    try {
        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            headers,
            body: formData
        });

        const json = await response.json();
        if (!response.ok) {
            throw new Error(json.message || 'Error al subir la imagen');
        }
        return json.data?.url || json.url;
    } catch (error) {
        console.error('Error subiendo imagen:', error);
        throw error;
    }
}

// Helper para buscar imágenes y detalles en TMDb si se tiene una API key configurada
async function tmdbFetch(endpoint, params = {}) {
    if (!TMDB_API_KEY || TMDB_API_KEY === 'TU_TMDB_API_KEY') {
        return null;
    }

    const queryParams = new URLSearchParams({
        api_key: TMDB_API_KEY,
        language: 'es-MX',
        ...params
    });

    try {
        const response = await fetch(`${TMDB_BASE_URL}${endpoint}?${queryParams}`);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error('TMDb Error:', error);
        return null;
    }
}

// Obtener la URL del póster oficial desde TMDb por título con fallback estético
async function getTmdbPoster(titulo) {
    const data = await tmdbFetch('/search/multi', { query: titulo });
    if (data && data.results && data.results.length > 0) {
        const posterPath = data.results[0].poster_path;
        if (posterPath) {
            return `${TMDB_IMAGE_BASE}${posterPath}`;
        }
    }
    return 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80';
}
