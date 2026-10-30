/**
 * Controlador de la página principal (Catálogo)
 */

// Placeholder visual cuando una imagen no carga
function handleImgError(img) {
    img.onerror = null;
    img.style.display = 'none';
    const placeholder = document.createElement('div');
    placeholder.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1e293b,#334155);padding:1.5rem;text-align:center;font-size:1.1rem;font-weight:600;color:#94a3b8;';
    placeholder.textContent = img.alt || 'Sin imagen';
    img.parentElement.insertBefore(placeholder, img);
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuthNav();
    loadCategories();
    loadContents();

    const searchInput = document.getElementById('search-input');
    const typeSelect = document.getElementById('type-filter');
    const categorySelect = document.getElementById('category-filter');
    const classSelect = document.getElementById('classification-filter');
    const orderSelect = document.getElementById('order-filter');

    if (searchInput) searchInput.addEventListener('input', () => filterAndLoad());
    if (typeSelect) typeSelect.addEventListener('change', () => filterAndLoad());
    if (categorySelect) categorySelect.addEventListener('change', () => filterAndLoad());
    if (classSelect) classSelect.addEventListener('change', () => filterAndLoad());
    if (orderSelect) orderSelect.addEventListener('change', () => filterAndLoad());

    // Mostrar botón de proponer obra si está autenticado
    const token = localStorage.getItem('token');
    const proposeContainer = document.getElementById('btn-propose-container');
    if (token && proposeContainer) {
        proposeContainer.style.display = 'block';
    }

    setupModal();
});

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

// Configuración y eventos del modal de creación
function setupModal() {
    const modal = document.getElementById('modal-propose');
    const btnOpen = document.getElementById('btn-open-modal');
    const btnClose = document.getElementById('btn-close-modal');
    const btnCancel = document.getElementById('btn-cancel-modal');
    const form = document.getElementById('propose-form');

    if (!modal) return;

    const openModal = () => { modal.style.display = 'flex'; };
    const closeModal = () => { 
        modal.style.display = 'none'; 
        if (form) form.reset();
        const tmdbResults = document.getElementById('tmdb-results');
        if (tmdbResults) {
            tmdbResults.innerHTML = '';
            tmdbResults.style.display = 'none';
        }
    };

    if (btnOpen) btnOpen.addEventListener('click', openModal);
    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);

    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Manejo de subida de fotos desde el equipo
    const fileInput = document.getElementById('p-file');
    const previewWrap = document.getElementById('p-preview-container');
    const previewImg = document.getElementById('p-preview-img');
    const previewName = document.getElementById('p-preview-name');
    const uploadedUrlInput = document.getElementById('p-uploaded-url');

    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (re) => {
                if (previewImg) previewImg.src = re.target.result;
                if (previewWrap) previewWrap.style.display = 'flex';
                if (previewName) previewName.textContent = file.name;
            };
            reader.readAsDataURL(file);

            try {
                const url = await apiUpload(file);
                if (uploadedUrlInput) uploadedUrlInput.value = url;
                const imagenInput = document.getElementById('p-imagen');
                if (imagenInput && !imagenInput.value) imagenInput.value = url;
            } catch (err) {
                console.warn('Subida directa no completada, se mantendrá vista previa:', err);
            }
        });
    }

    // Búsqueda en TMDb para autocompletar
    setupTmdbAutofill();

    // Envío del formulario
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const titulo = document.getElementById('p-titulo').value.trim();
            const tipo_id = parseInt(document.getElementById('p-tipo').value);
            const categoria_id = parseInt(document.getElementById('p-categoria').value);
            const anio = parseInt(document.getElementById('p-anio').value);
            const clasificacion = document.getElementById('p-clasificacion')?.value || '+13';
            const duracion_minutos = document.getElementById('p-duracion').value ? parseInt(document.getElementById('p-duracion').value) : null;
            const uploadedUrl = document.getElementById('p-uploaded-url')?.value;
            const imagenInputVal = document.getElementById('p-imagen')?.value.trim();
            const previewImgSrc = document.getElementById('p-preview-img')?.src;
            const imagen_url = uploadedUrl || imagenInputVal || (previewImgSrc?.startsWith('data:') ? previewImgSrc : null);
            const sinopsis = document.getElementById('p-sinopsis').value.trim();

            try {
                const response = await apiFetch('/contenidos', {
                    method: 'POST',
                    body: JSON.stringify({
                        titulo,
                        tipo_id,
                        categoria_id,
                        anio,
                        clasificacion,
                        duracion_minutos,
                        imagen_url,
                        sinopsis
                    })
                });

                const msg = response.estado === 'APROBADO' 
                    ? 'Obra agregada y publicada con éxito.' 
                    : 'Propuesta enviada. Queda en revisión por un administrador.';
                alert(msg);
                
                closeModal();
                filterAndLoad();
            } catch (error) {
                alert('No se pudo registrar la obra: ' + error.message);
            }
        });
    }
}

// Búsqueda en TMDb dentro del modal
function setupTmdbAutofill() {
    const btnTmdbSearch = document.getElementById('btn-tmdb-search');
    const inputTmdbSearch = document.getElementById('tmdb-search-input');
    const containerTmdbResults = document.getElementById('tmdb-results');

    if (!btnTmdbSearch || !inputTmdbSearch || !containerTmdbResults) return;

    const doTmdbSearch = async () => {
        const query = inputTmdbSearch.value.trim();
        if (!query) return;

        btnTmdbSearch.disabled = true;
        btnTmdbSearch.textContent = 'Buscando...';
        containerTmdbResults.style.display = 'block';
        containerTmdbResults.innerHTML = '<p style="padding: 0.75rem; color: var(--text-muted); font-size: 0.85rem;">Buscando coincidencias...</p>';

        try {
            let items = [];
            try {
                const res = await apiFetch(`/tmdb/search?query=${encodeURIComponent(query)}`);
                items = res?.results || [];
            } catch (e) {
                const fallback = await tmdbFetch('/search/multi', { query });
                if (fallback && fallback.results) {
                    items = fallback.results.map(item => ({
                        titulo: item.title || item.name,
                        anio: (item.release_date || item.first_air_date)?.substring(0, 4),
                        sinopsis: item.overview,
                        poster_url: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
                        media_type: item.media_type
                    }));
                }
            }

            if (!items || items.length === 0) {
                containerTmdbResults.innerHTML = '<p style="padding: 0.75rem; color: var(--text-muted); font-size: 0.85rem;">No se encontraron resultados en TMDb.</p>';
                return;
            }

            containerTmdbResults.innerHTML = items.slice(0, 5).map((item, idx) => `
                <div class="tmdb-item" data-idx="${idx}" style="display: flex; gap: 0.75rem; padding: 0.6rem; border-bottom: 1px solid var(--border-color); cursor: pointer; align-items: center;">
                    <img src="${item.poster_url || 'https://via.placeholder.com/40x55?text=S%26J'}" style="width: 40px; height: 55px; object-fit: cover; border-radius: 0.25rem;">
                    <div style="flex: 1;">
                        <p style="font-weight: 600; font-size: 0.85rem; color: var(--text-color); margin-bottom: 0.15rem;">${item.titulo} <span style="color: var(--text-muted); font-size: 0.8rem;">(${item.anio || 'N/A'})</span></p>
                        <p style="font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 320px;">${item.sinopsis || 'Sin descripción'}</p>
                    </div>
                    <button type="button" class="btn btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">Usar</button>
                </div>
            `).join('');

            containerTmdbResults.querySelectorAll('.tmdb-item').forEach(el => {
                el.addEventListener('click', () => {
                    const idx = parseInt(el.dataset.idx);
                    const selected = items[idx];
                    if (selected) {
                        document.getElementById('p-titulo').value = selected.titulo || '';
                        if (selected.anio) document.getElementById('p-anio').value = selected.anio;
                        if (selected.sinopsis) document.getElementById('p-sinopsis').value = selected.sinopsis;
                        if (selected.poster_url) document.getElementById('p-imagen').value = selected.poster_url;
                        if (selected.media_type === 'tv') {
                            document.getElementById('p-tipo').value = '2';
                        } else if (selected.media_type === 'movie') {
                            document.getElementById('p-tipo').value = '1';
                        }
                        containerTmdbResults.style.display = 'none';
                    }
                });
            });

        } catch (err) {
            containerTmdbResults.innerHTML = `<p style="padding: 0.75rem; color: var(--danger-color); font-size: 0.85rem;">Error buscando en TMDb: ${err.message}</p>`;
        } finally {
            btnTmdbSearch.disabled = false;
            btnTmdbSearch.textContent = 'Buscar';
        }
    };

    btnTmdbSearch.addEventListener('click', doTmdbSearch);
    inputTmdbSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            doTmdbSearch();
        }
    });
}

// Filtro y recarga
function filterAndLoad() {
    const search = document.getElementById('search-input')?.value || '';
    const typeId = document.getElementById('type-filter')?.value || '';
    const categoryId = document.getElementById('category-filter')?.value || '';
    const classification = document.getElementById('classification-filter')?.value || '';
    const orderBy = document.getElementById('order-filter')?.value || 'popularidad';
    loadContents(search, typeId, categoryId, classification, orderBy);
}

// Cargar categorías en el select
async function loadCategories() {
    try {
        const categories = await apiFetch('/categorias');
        const select = document.getElementById('category-filter');
        const modalSelect = document.getElementById('p-categoria');
        if (!categories) return;

        categories.forEach(cat => {
            if (select) {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.nombre;
                select.appendChild(option);
            }
            if (modalSelect) {
                const optionModal = document.createElement('option');
                optionModal.value = cat.id;
                optionModal.textContent = cat.nombre;
                modalSelect.appendChild(optionModal);
            }
        });
    } catch (error) {
        console.error('Error al cargar categorías:', error);
    }
}

// Cargar catálogo de contenidos
async function loadContents(search = '', typeId = '', categoryId = '', classification = '', orderBy = 'popularidad') {
    const grid = document.getElementById('content-grid');
    if (!grid) return;
    grid.innerHTML = '<p style="grid-column: 1 / -1; color: var(--text-muted); text-align: center; padding: 2rem;">Cargando catálogo...</p>';

    try {
        let endpoint;
        if (orderBy === 'bayesiano') {
            endpoint = `/ranking?limit=30`;
            if (categoryId) endpoint += `&categoria_id=${categoryId}`;
        } else {
            endpoint = `/contenidos?search=${encodeURIComponent(search)}&orderBy=${orderBy}`;
            if (typeId) endpoint += `&tipo_id=${typeId}`;
            if (categoryId) endpoint += `&categoria_id=${categoryId}`;
        }

        let data = await apiFetch(endpoint);
        
        // Filtro por clasificación de edad en cliente
        if (classification && Array.isArray(data)) {
            data = data.filter(item => (item.clasificacion || '').toUpperCase() === classification.toUpperCase());
        }

        if (!data || data.length === 0) {
            grid.innerHTML = '<p style="color: var(--text-muted); grid-column: 1 / -1; padding: 3rem 0; text-align: center; font-size: 1rem;">No se encontraron registros con los criterios seleccionados.</p>';
            return;
        }

        const cardsHTML = await Promise.all(data.map(async (item) => {
            const imageUrl = item.imagen_url || await getTmdbPoster(item.titulo);
            const scoreDisplay = orderBy === 'bayesiano'
                ? `Score: ${item.ranking_bayesiano || '0.00'}`
                : `Rating: ${item.rating_promedio || '0.00'} (${item.total_votos || 0} votos)`;
            
            const categoriaNombre = item.categoria?.nombre || item.categoria || '';
            const tipoNombre = item.tipo?.nombre || item.tipo || 'Película';
            const clasificacion = item.clasificacion || '+13';

            return `
                <article class="card">
                    <div class="card-img-wrap">
                        <img src="${imageUrl}" alt="${item.titulo}" class="card-img" onerror="handleImgError(this)">
                        <div style="position: absolute; top: 10px; left: 10px; display: flex; gap: 0.35rem;">
                            ${getTypeBadge(tipoNombre)}
                            ${getAgeBadge(clasificacion)}
                        </div>
                        <div style="position: absolute; top: 10px; right: 10px;">
                            ${categoriaNombre ? getCategoryBadge(categoriaNombre) : ''}
                        </div>
                    </div>

                    <div class="card-body">
                        <div>
                            <h3 class="card-title">${item.titulo}</h3>
                            <p class="card-meta">${item.anio} • ${clasificacion}</p>
                            <p class="card-rating">${scoreDisplay}</p>
                        </div>
                        <a href="detalle.html?id=${item.id}" class="btn" style="width: 100%;">Ver Detalle</a>
                    </div>
                </article>
            `;
        }));

        grid.innerHTML = cardsHTML.join('');

    } catch (error) {
        grid.innerHTML = `<p style="color: var(--danger-color); grid-column: 1 / -1;">Error al cargar el catálogo: ${error.message}</p>`;
    }
}
