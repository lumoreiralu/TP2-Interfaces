// Controla el menú lateral de categorías y sus transiciones
document.addEventListener('DOMContentLoaded', function() {
    const menuBtn = document.getElementById('menuBtn');
    const sidebarMenu = document.getElementById('sidebarMenu');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const overlay = document.getElementById('overlay');

    // Abre el menu.  agrega '.active' al panel y al overl
    function openMenu() {
        sidebarMenu.classList.add('active');
        overlay.classList.add('active');
    }

    // Cierra el menu: saca '.active' de ambos. Es el inverso exact
    function closeMenu() {
        sidebarMenu.classList.remove('active');
        overlay.classList.remove('active');
    }

    // Eventos.
    if (menuBtn) {
        /* El boton hamburguesa del header. */
        menuBtn.addEventListener('click', openMenu);
    }

    if (closeMenuBtn) {
        /* La X de cerrar, adentro del panel. */
        closeMenuBtn.addEventListener('click', closeMenu);
    }

    if (overlay) {
        // Click en el fondo oscuro = cerrar. Es el comportamiento espe
        overlay.addEventListener('click', closeMenu);
    }
});