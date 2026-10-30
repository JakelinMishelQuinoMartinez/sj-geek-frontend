function checkAuthNav() {
    const navMenu = document.getElementById('nav-menu');
    if (!navMenu) return;

    const token = localStorage.getItem('token');
    const rol = (localStorage.getItem('rol') || '').toUpperCase();
    const currentPath = window.location.pathname;

    if (token) {
        const isAdmin = (rol === 'ADMIN' || rol === '1');
        const adminLink = isAdmin ? `<a href="admin.html" class="${currentPath.includes('admin') ? 'active' : ''}">Panel Admin</a>` : '';
        
        navMenu.innerHTML = `
            <a href="index.html" class="${currentPath.includes('index') || currentPath.endsWith('/') ? 'active' : ''}">Inicio</a>
            ${adminLink}
            <a href="#" id="btn-logout" style="color: var(--danger-color);">Cerrar Sesión</a>
        `;

        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.clear();
                window.location.href = 'login.html';
            });
        }
    } else {
        navMenu.innerHTML = `
            <a href="index.html" class="${currentPath.includes('index') || currentPath.endsWith('/') ? 'active' : ''}">Inicio</a>
            <a href="login.html" class="${currentPath.includes('login') ? 'active' : ''}">Iniciar Sesión</a>
            <a href="register.html" class="${currentPath.includes('register') ? 'active' : ''}">Registrarse</a>
        `;
    }
}
