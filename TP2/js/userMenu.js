document.addEventListener('DOMContentLoaded', function() {
    const userBtn = document.getElementById('userBtn');
    const sidebarUser = document.getElementById('sidebarUser');
    const closeUserBtn = document.getElementById('closeUserBtn');
    const overlay = document.getElementById('overlay');

    // Función para abrir el menú
    function openMenu() {
        sidebarUser.classList.add('active');
        overlay.classList.add('active');
    }

    // Función para cerrar el menú
    function closeMenu() {
        sidebarUser.classList.remove('active');
        overlay.classList.remove('active');
    }

    // Eventos
    if (userBtn) {
        userBtn.addEventListener('click', openMenu);
    }

    if (closeUserBtn) {
        closeUserBtn.addEventListener('click', closeMenu);
    }

    if (overlay) {
        overlay.addEventListener('click', closeMenu);
    }
});