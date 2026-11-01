const API_URL = window.SJ_GEEK_API_URL || 'http://localhost:3000/api';
const TMDB_API_KEY = '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
        const json = await response.json();

        if (!response.ok) {
            let errorMessage = json.message || 'Error en la solicitud al servidor';
            if (Array.isArray(json.errors)) {
                errorMessage += ': ' + json.errors.map(error => error.message || error.msg).join(', ');
            }
            throw new Error(errorMessage);
        }

        if (json && json.data !== undefined) {
            if (json.data?.token && json.data?.user) {
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

async function apiUpload(file) {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('foto', file);

    const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
    });
    const json = await response.json();
    if (!response.ok) {
        throw new Error(json.message || 'Error al subir la imagen');
    }
    return json.data?.url || json.url;
}

async function tmdbFetch(endpoint, params = {}) {
    if (!TMDB_API_KEY) return null;
    const queryParams = new URLSearchParams({ api_key: TMDB_API_KEY, language: 'es-MX', ...params });
    const response = await fetch(`${TMDB_BASE_URL}${endpoint}?${queryParams}`);
    return response.ok ? response.json() : null;
}

async function getTmdbPoster(titulo) {
    const data = await tmdbFetch('/search/multi', { query: titulo });
    const posterPath = data?.results?.find(item => item.poster_path)?.poster_path;
    return posterPath
        ? `${TMDB_IMAGE_BASE}${posterPath}`
        : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80';
}
