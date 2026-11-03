/**
 * Controlador de la vista de Detalle de Obra y Reseñas
 */

// Placeholder visual cuando una imagen no carga
function handleImgError(img) {
    img.onerror = null;
    img.style.display = 'none';
    const placeholder = document.createElement('div');
    placeholder.style.cssText = 'width:270px;height:390px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1e293b,#334155);padding:1.5rem;text-align:center;font-size:1.1rem;font-weight:600;color:#94a3b8;border-radius:0.375rem;';
    placeholder.textContent = img.alt || 'Sin imagen';
    img.parentElement.insertBefore(placeholder, img);
}

let currentContentId = null;

// Helpers de etiquetas visuales
function getCategoryBadge(nombre = '') {
    return `<span class="badge badge-cat">${nombre}</span>`;
}

function getTypeBadge(tipo = '') {
    const label = tipo.nombre || tipo || 'Obra';
    return `<span class="badge badge-type">${label}</span>`;
}

function getAgeBadge(clasificacion = '+13') {
    const key = (clasificacion || '+13').toUpperCase().trim();
    let modifier = 'badge-age-13';
    if (key === 'TP') modifier = 'badge-age-tp';
    else if (key === '+16') modifier = 'badge-age-16';
    else if (key === '+18') modifier = 'badge-age-18';

    return `<span class="badge badge-age ${modifier}">${key}</span>`;
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuthNav();
    const urlParams = new URLSearchParams(window.location.search);
    currentContentId = urlParams.get('id');

    if (!currentContentId) {
        window.location.href = 'index.html';
        return;
    }

    const token = localStorage.getItem('token');
    const reviewSec = document.getElementById('add-review-section');
    if (reviewSec) {
        if (token) {
            reviewSec.style.display = 'block';
        } else {
            reviewSec.style.display = 'block';
            reviewSec.innerHTML = `
                <div style="background: var(--card-bg); padding: 1.5rem; border-radius: 0.5rem; border: 1px solid var(--border-color); text-align: center;">
                    <p style="color: var(--text-muted); margin-bottom: 1rem;">Inicia sesión para calificar y dejar tu opinión sobre esta obra.</p>
                    <a href="login.html" class="btn">Iniciar Sesión</a>
                </div>
            `;
        }
    }

    loadDetail(currentContentId);
    loadReviews(currentContentId);

    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', handleCreateReview);
    }
});

// Cargar detalles de la obra
async function loadDetail(id) {
    const container = document.getElementById('content-detail');
    try {
        const item = await apiFetch(`/contenidos/${id}`);
        
        let posterUrl = item.imagen_url || await getTmdbPoster(item.titulo);
        let trailerIframe = '';

        // Búsqueda opcional de tráiler en TMDb
        const tmdbData = await tmdbFetch('/search/multi', { query: item.titulo });
        if (tmdbData && tmdbData.results && tmdbData.results.length > 0) {
            const match = tmdbData.results[0];
            const mediaType = match.media_type === 'tv' ? 'tv' : 'movie';
            const videosData = await tmdbFetch(`/${mediaType}/${match.id}/videos`);
            if (videosData && videosData.results) {
                const trailer = videosData.results.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
                if (trailer) {
                    trailerIframe = `
                        <div style="margin-top: 1.5rem;">
                            <h4 style="margin-bottom: 0.6rem; font-size: 1rem;">Tráiler Oficial</h4>
                            <iframe width="100%" height="280" src="https://www.youtube.com/embed/${trailer.key}" frameborder="0" allowfullscreen style="border-radius: 0.375rem; max-width: 560px;"></iframe>
                        </div>
                    `;
                }
            }
        }

        const categoriaNombre = item.categoria ? (item.categoria.nombre || item.categoria) : 'General';
        const tipoNombre = item.tipo ? (item.tipo.nombre || item.tipo) : 'Película';
        const clasificacion = item.clasificacion || '+13';

        container.innerHTML = `
            <div style="display: flex; gap: 2rem; flex-wrap: wrap; background: var(--card-bg); padding: 2rem; border-radius: 0.5rem; border: 1px solid var(--border-color);">
                <img src="${posterUrl}" alt="${item.titulo}" style="width: 270px; height: 390px; object-fit: cover; border-radius: 0.375rem; box-shadow: 0 4px 15px rgba(0,0,0,0.4);" onerror="handleImgError(this)">
                
                <div style="flex: 1; min-width: 300px;">
                    <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap; align-items: center;">
                        ${getTypeBadge(tipoNombre)}
                        ${categoriaNombre ? getCategoryBadge(categoriaNombre) : ''}
                        ${getAgeBadge(clasificacion)}
                        <span class="badge" style="background: var(--border-color); color: var(--text-color);">${item.anio}</span>
                        ${item.duracion_minutos ? `<span class="badge" style="background: var(--border-color); color: var(--text-color);">${item.duracion_minutos} min</span>` : ''}
                    </div>

                    <h1 style="font-size: 2.2rem; margin-bottom: 0.75rem; font-weight: 700;">${item.titulo}</h1>
                    
                    <div style="display: flex; gap: 1.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; align-items: center; background: rgba(11, 17, 32, 0.6); padding: 0.75rem 1rem; border-radius: 0.375rem; border: 1px solid var(--border-color); width: fit-content;">
                        <div style="font-size: 1.15rem; color: var(--gold); font-weight: 700;">
                            Rating: ${item.rating_promedio || '0.00'} / 10
                        </div>
                        <div style="color: var(--text-muted); font-size: 0.9rem;">
                            ${item.total_votos || 0} reseñas
                        </div>
                        ${item.porcentaje_fresco ? `
                            <div style="color: var(--success-color); font-size: 0.9rem; font-weight: 600;">
                                ${item.porcentaje_fresco}% de recomendación
                            </div>
                        ` : ''}
                    </div>

                    <h3 style="margin-bottom: 0.4rem; font-size: 1.1rem;">Sinopsis</h3>
                    <p style="color: var(--text-muted); line-height: 1.6; font-size: 0.95rem; margin-bottom: 1.25rem;">
                        ${item.sinopsis}
                    </p>
                    
                    ${trailerIframe}
                </div>
            </div>
        `;
    } catch (error) {
        container.innerHTML = `<p style="color: var(--danger-color);">Error al cargar detalle: ${error.message}</p>`;
    }
}

// Cargar lista de reseñas
async function loadReviews(id) {
    const container = document.getElementById('reviews-container');
    const currentUserId = parseInt(localStorage.getItem('usuario_id') || '0');
    const currentUserRole = localStorage.getItem('rol');

    try {
        const reviews = await apiFetch(`/resenas/contenido/${id}`);
        if (!reviews || reviews.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); padding: 0.5rem 0;">Aún no hay reseñas registradas para esta obra.</p>';
            return;
        }

        container.innerHTML = reviews.map(rev => {
            const isAuthor = rev.autor?.id === currentUserId || rev.usuario_id === currentUserId;
            const canManage = isAuthor || currentUserRole === 'ADMIN' || currentUserRole === '1';
            const isAdminAuthor = rev.autor?.rol === 'ADMIN' || rev.autor?.id === 1 || rev.usuario_id === 1;

            return `
                <div class="review-card" id="review-card-${rev.id}">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem;">
                        <div>
                            <h4 style="font-size: 1.05rem; font-weight: 600; color: var(--text-color);">${rev.titulo_resena}</h4>
                            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.15rem;">
                                Por <strong>${rev.autor?.nombre || 'Usuario'}</strong>
                                ${isAdminAuthor ? '<span class="badge" style="background: var(--accent-color); font-size: 0.65rem; margin-left: 0.3rem; padding: 0.1rem 0.35rem;">Admin</span>' : ''}
                                • ${new Date(rev.created_at).toLocaleDateString()}
                            </p>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <span style="color: var(--gold); font-weight: 700; font-size: 0.95rem;">
                                ${rev.rating} / 10
                            </span>
                            ${canManage ? `
                                <button class="btn btn-danger" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;" onclick="eliminarResena(${rev.id})">Eliminar</button>
                            ` : ''}
                        </div>
                    </div>

                    <p style="margin: 0.85rem 0; color: #e2e8f0; line-height: 1.5; font-size: 0.9rem;">${rev.comentario}</p>

                    <div class="reaction-btns" style="align-items: center; border-top: 1px solid var(--border-color); padding-top: 0.65rem;">
                        ${!isAuthor ? `
                            <button class="btn btn-secondary" style="background: ${rev.mi_reaccion === 'LIKE' ? 'var(--accent-color)' : 'transparent'}; padding: 0.25rem 0.65rem; font-size: 0.8rem;" onclick="reaccionar(${rev.id}, 'LIKE')">
                                Me gusta (${rev.likes || 0})
                            </button>
                            <button class="btn btn-secondary" style="background: ${rev.mi_reaccion === 'DISLIKE' ? 'var(--danger-color)' : 'transparent'}; padding: 0.25rem 0.65rem; font-size: 0.8rem;" onclick="reaccionar(${rev.id}, 'DISLIKE')">
                                No me gusta (${rev.dislikes || 0})
                            </button>
                        ` : `
                            <span style="color: var(--text-muted); font-size: 0.8rem;">
                                ${rev.likes || 0} Me gusta • ${rev.dislikes || 0} No me gusta
                            </span>
                        `}
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        container.innerHTML = `<p style="color: var(--danger-color);">Error al cargar reseñas: ${error.message}</p>`;
    }
}

// Crear nueva reseña
async function handleCreateReview(e) {
    e.preventDefault();
    const titulo = document.getElementById('titulo_resena').value.trim();
    const rating = parseInt(document.getElementById('rating').value);
    const comentario = document.getElementById('comentario').value.trim();

    try {
        await apiFetch('/resenas', {
            method: 'POST',
            body: JSON.stringify({
                contenido_id: parseInt(currentContentId),
                titulo,
                rating,
                comentario
            })
        });

        alert('Reseña guardada correctamente.');
        document.getElementById('review-form').reset();
        loadDetail(currentContentId);
        loadReviews(currentContentId);
    } catch (error) {
        alert('No se pudo guardar la reseña: ' + error.message);
    }
}

// Eliminar reseña
async function eliminarResena(id) {
    if (!confirm('¿Deseas eliminar esta reseña?')) return;

    try {
        await apiFetch(`/resenas/${id}`, {
            method: 'DELETE'
        });
        alert('Reseña eliminada.');
        loadDetail(currentContentId);
        loadReviews(currentContentId);
    } catch (error) {
        alert('Error al eliminar reseña: ' + error.message);
    }
}

// Reaccionar a reseña
async function reaccionar(resenaId, tipo) {
    if (!localStorage.getItem('token')) {
        alert('Debes iniciar sesión para calificar reseñas.');
        window.location.href = 'login.html';
        return;
    }

    try {
        await apiFetch(`/resenas/${resenaId}/reaccion`, {
            method: 'POST',
            body: JSON.stringify({ tipo })
        });
        loadReviews(currentContentId);
    } catch (error) {
        alert('Error: ' + error.message);
    }
}
