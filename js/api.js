const API_URL = window.SJ_GEEK_API_URL || 'http://localhost:3000/api';
const TMDB_API_KEY = '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    const json = await response.json();

    if (!response.ok) {
      let errorMsg = json.message || 'Error en la solicitud al servidor';
      if (Array.isArray(json.errors)) {
        errorMsg += ': ' + json.errors.map(error => error.message || error.msg).join(', ');
      }
      throw new Error(errorMsg);
    }

    if (json && json.data !== undefined) {
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
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  try {
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers,
      body: formData
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.message || 'Error al subir la imagen');
    return json.data?.url || json.url;
  } catch (error) {
    console.error('Error subiendo imagen:', error);
    throw error;
  }
}

async function tmdbFetch(endpoint, params = {}) {
  if (!TMDB_API_KEY || TMDB_API_KEY === 'TU_TMDB_API_KEY') return null;
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

async function getTmdbPoster(titulo) {
  const data = await tmdbFetch('/search/multi', { query: titulo });
  if (data?.results?.length > 0 && data.results[0].poster_path) {
    return `${TMDB_IMAGE_BASE}${data.results[0].poster_path}`;
  }
  return 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80';
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
