/**
 * Controlador del Panel de Administración
 * Aprobación de obras, publicación directa con subida de fotos y gestión de categorías
 */

document.addEventListener('DOMContentLoaded', () => {
    checkAuthNav();
    const rol = (localStorage.getItem('rol') || '').toUpperCase();

    if (rol !== 'ADMIN' && rol !== '1') {
        alert('Acceso restringido a administradores.');
        window.location.href = 'index.html';
        return;
    }

    setupTabs();
    loadPendingContents();
    loadAdminCategories();
    setupAdminMovieForm();

    const catForm = document.getElementById('category-form');
    if (catForm) {
        catForm.addEventListener('submit', handleSaveCategory);
    }

    const btnCancelCat = document.getElementById('btn-cancel-cat');
    if (btnCancelCat) {
        btnCancelCat.addEventListener('click', resetCategoryForm);
    }
});

// Pestañas del Panel
function setupTabs() {
    const tabPendientes = document.getElementById('tab-pendientes');
    const tabCrear = document.getElementById('tab-crear');
    const tabCategorias = document.getElementById('tab-categorias');
    
    const secPendientes = document.getElementById('sec-pendientes');
    const secCrear = document.getElementById('sec-crear');
    const secCategorias = document.getElementById('sec-categorias');

    const resetTabs = () => {
        [tabPendientes, tabCrear, tabCategorias].forEach(t => {
            if (t) {
                t.style.background = 'transparent';
                t.style.color = 'var(--text-muted)';
            }
        });
        [secPendientes, secCrear, secCategorias].forEach(s => {
            if (s) s.style.display = 'none';
        });
    };

    if (tabPendientes) {
        tabPendientes.addEventListener('click', () => {
            resetTabs();
            tabPendientes.style.background = 'var(--accent-color)';
            tabPendientes.style.color = '#fff';
            secPendientes.style.display = 'block';
            loadPendingContents();
        });
    }

    if (tabCrear) {
        tabCrear.addEventListener('click', () => {
            resetTabs();
            tabCrear.style.background = 'var(--accent-color)';
            tabCrear.style.color = '#fff';
            secCrear.style.display = 'block';
            loadMovieFormCategories();
        });
    }

    if (tabCategorias) {
        tabCategorias.addEventListener('click', () => {
            resetTabs();
            tabCategorias.style.background = 'var(--accent-color)';
            tabCategorias.style.color = '#fff';
            secCategorias.style.display = 'block';
            loadAdminCategories();
        });
    }
}

// 1. Obras pendientes de revisión
async function loadPendingContents() {
    const container = document.getElementById('pending-list');
    if (!container) return;
    try {
        const data = await apiFetch('/contenidos/pendientes');
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div style="background: var(--card-bg); padding: 2rem; border-radius: 0.375rem; border: 1px solid var(--border-color); text-align: center; color: var(--text-muted);">
                    No hay solicitudes pendientes de revisión.
                </div>
            `;
            return;
        }

        container.innerHTML = data.map(item => `
            <div style="background: var(--card-bg); padding: 1.25rem; border-radius: 0.375rem; margin-bottom: 1rem; border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <div style="flex: 1; min-width: 250px;">
                    <div style="display: flex; gap: 0.4rem; margin-bottom: 0.35rem;">
                        <span class="badge badge-type">${item.tipo?.nombre || 'Obra'}</span>
                        <span class="badge" style="background: var(--border-color); color: var(--text-color);">${item.categoria?.nombre || 'Categoría #' + item.categoria_id}</span>
                        <span class="badge" style="background: var(--border-color); color: var(--text-color);">${item.anio}</span>
                    </div>
                    <h4 style="font-size: 1.1rem; margin-bottom: 0.3rem;">${item.titulo}</h4>
                    <p style="color: var(--text-muted); font-size: 0.85rem; line-height: 1.5; margin-bottom: 0.4rem;">${item.sinopsis}</p>
                    <p style="color: var(--text-muted); font-size: 0.8rem;">Propuesto por: <strong>${item.autor?.nombre || 'Usuario #' + item.usuario_id}</strong></p>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-success" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;" onclick="aprobar(${item.id})">Aprobar</button>
                    <button class="btn btn-danger" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;" onclick="rechazar(${item.id})">Rechazar</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = `<p style="color: var(--danger-color);">Error al cargar pendientes: ${error.message}</p>`;
    }
}

async function aprobar(id) {
    if (!confirm('¿Deseas aprobar este contenido para publicarlo en el catálogo?')) return;
    try {
        await apiFetch(`/contenidos/${id}/estado`, {
            method: 'PATCH',
            body: JSON.stringify({ estado: 'APROBADO' })
        });
        alert('Obra aprobada con éxito.');
        loadPendingContents();
    } catch (error) {
        alert('Error al aprobar: ' + error.message);
    }
}

async function rechazar(id) {
    const motivo = prompt('Ingresa el motivo del rechazo (obligatorio):');
    if (!motivo || motivo.trim() === '') return;

    try {
        await apiFetch(`/contenidos/${id}/estado`, {
            method: 'PATCH',
            body: JSON.stringify({ estado: 'RECHAZADO', motivo_rechazo: motivo.trim() })
        });
        alert('Contenido rechazado.');
        loadPendingContents();
    } catch (error) {
        alert('Error al rechazar: ' + error.message);
    }
}

// 2. Publicar Obra Directa (Admin) con Subida de Fotos
async function loadMovieFormCategories() {
    const select = document.getElementById('adm-categoria');
    if (!select || select.children.length > 1) return;
    try {
        const categories = await apiFetch('/categorias');
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.nombre;
            select.appendChild(opt);
        });
    } catch (err) {
        console.error('Error cargando categorías para formulario:', err);
    }
}

function setupAdminMovieForm() {
    const form = document.getElementById('admin-movie-form');
    const fileInput = document.getElementById('adm-file');
    const previewWrap = document.getElementById('adm-preview-wrap');
    const previewImg = document.getElementById('adm-preview-img');
    const previewText = document.getElementById('adm-preview-text');
    const uploadedUrlInput = document.getElementById('adm-uploaded-url');

    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Vista previa local instantánea
            const reader = new FileReader();
            reader.onload = (re) => {
                if (previewImg) previewImg.src = re.target.result;
                if (previewWrap) previewWrap.style.display = 'flex';
                if (previewText) previewText.textContent = `${file.name} (${Math.round(file.size / 1024)} KB)`;
            };
            reader.readAsDataURL(file);

            // Subir al backend
            try {
                const url = await apiUpload(file);
                if (uploadedUrlInput) uploadedUrlInput.value = url;
                const imagenInput = document.getElementById('adm-imagen');
                if (imagenInput && !imagenInput.value) imagenInput.value = url;
            } catch (err) {
                console.warn('Subida directa no completada, se mantendrá vista local:', err);
            }
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const titulo = document.getElementById('adm-titulo').value.trim();
            const tipo_id = parseInt(document.getElementById('adm-tipo').value);
            const categoria_id = parseInt(document.getElementById('adm-categoria').value);
            const anio = parseInt(document.getElementById('adm-anio').value);
            const clasificacion = document.getElementById('adm-clasificacion')?.value || '+13';
            const duracion_minutos = document.getElementById('adm-duracion').value ? parseInt(document.getElementById('adm-duracion').value) : null;
            
            const uploadedUrl = document.getElementById('adm-uploaded-url')?.value;
            const imagenInputVal = document.getElementById('adm-imagen')?.value.trim();
            const previewImgSrc = document.getElementById('adm-preview-img')?.src;
            const imagen_url = uploadedUrl || imagenInputVal || (previewImgSrc?.startsWith('data:') ? previewImgSrc : null);
            const sinopsis = document.getElementById('adm-sinopsis').value.trim();

            try {
                await apiFetch('/contenidos', {
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

                alert('Obra publicada exitosamente en el catálogo público.');
                form.reset();
                if (previewWrap) previewWrap.style.display = 'none';
                if (uploadedUrlInput) uploadedUrlInput.value = '';
            } catch (error) {
                alert('No se pudo publicar la obra: ' + error.message);
            }
        });
    }
}

// 3. CRUD de categorías
async function loadAdminCategories() {
    const container = document.getElementById('categories-list');
    if (!container) return;
    try {
        const categories = await apiFetch('/categorias');
        if (!categories || categories.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted);">No hay categorías registradas.</p>';
            return;
        }

        container.innerHTML = categories.map(cat => `
            <div style="background: var(--card-bg); padding: 1rem; border-radius: 0.375rem; margin-bottom: 0.75rem; border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
                <div>
                    <h4 style="font-size: 0.95rem; margin-bottom: 0.2rem;">${cat.nombre}</h4>
                    <p style="color: var(--text-muted); font-size: 0.85rem;">${cat.descripcion || 'Sin descripción'}</p>
                </div>
                <div style="display: flex; gap: 0.4rem;">
                    <button class="btn btn-secondary" style="padding: 0.3rem 0.65rem; font-size: 0.8rem;" onclick="editarCategoria(${cat.id}, '${escapeHtml(cat.nombre)}', '${escapeHtml(cat.descripcion || '')}')">Editar</button>
                    <button class="btn btn-danger" style="padding: 0.3rem 0.65rem; font-size: 0.8rem;" onclick="eliminarCategoria(${cat.id})">Eliminar</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = `<p style="color: var(--danger-color);">Error al cargar categorías: ${error.message}</p>`;
    }
}

function escapeHtml(text) {
    return text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function editarCategoria(id, nombre, descripcion) {
    document.getElementById('cat-id').value = id;
    document.getElementById('cat-nombre').value = nombre;
    document.getElementById('cat-descripcion').value = descripcion;
    document.getElementById('cat-form-title').textContent = 'Editar Categoría';
    document.getElementById('btn-save-cat').textContent = 'Actualizar';
    document.getElementById('btn-cancel-cat').style.display = 'inline-block';
}

function resetCategoryForm() {
    document.getElementById('cat-id').value = '';
    document.getElementById('cat-nombre').value = '';
    document.getElementById('cat-descripcion').value = '';
    document.getElementById('cat-form-title').textContent = 'Nueva Categoría';
    document.getElementById('btn-save-cat').textContent = 'Guardar';
    document.getElementById('btn-cancel-cat').style.display = 'none';
}

async function handleSaveCategory(e) {
    e.preventDefault();
    const id = document.getElementById('cat-id').value;
    const nombre = document.getElementById('cat-nombre').value.trim();
    const descripcion = document.getElementById('cat-descripcion').value.trim() || null;

    try {
        if (id) {
            await apiFetch(`/categorias/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ nombre, descripcion })
            });
            alert('Categoría actualizada.');
        } else {
            await apiFetch('/categorias', {
                method: 'POST',
                body: JSON.stringify({ nombre, descripcion })
            });
            alert('Categoría creada.');
        }

        resetCategoryForm();
        loadAdminCategories();
    } catch (error) {
        alert('Error al guardar categoría: ' + error.message);
    }
}

async function eliminarCategoria(id) {
    if (!confirm('¿Deseas eliminar esta categoría? Si contiene obras asociadas no podrá ser borrada.')) return;

    try {
        await apiFetch(`/categorias/${id}`, {
            method: 'DELETE'
        });
        alert('Categoría eliminada.');
        loadAdminCategories();
    } catch (error) {
        alert('Error al eliminar categoría: ' + error.message);
    }
}
