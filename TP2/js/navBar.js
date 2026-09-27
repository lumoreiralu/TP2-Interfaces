document.addEventListener('DOMContentLoaded', function() {
    const menuBtn = document.getElementById('menuBtn');
    const sidebarMenu = document.getElementById('sidebarMenu');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const overlay = document.getElementById('overlay');

    // Función para abrir el menú
    function openMenu() {
        sidebarMenu.classList.add('active');
        overlay.classList.add('active');
    }

    // Función para cerrar el menú
    function closeMenu() {
        sidebarMenu.classList.remove('active');
        overlay.classList.remove('active');
    }

    // Eventos
    if (menuBtn) {
        menuBtn.addEventListener('click', openMenu);
    }

    if (closeMenuBtn) {
        closeMenuBtn.addEventListener('click', closeMenu);
    }

    if (overlay) {
        overlay.addEventListener('click', closeMenu);
    }
});