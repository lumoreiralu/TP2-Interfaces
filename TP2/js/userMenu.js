// Controla el menú lateral derecho del usuario
document.addEventListener('DOMContentLoaded', function() {
    const userBtn = document.getElementById('userBtn');
    const sidebarUser = document.getElementById('sidebarUserRight');
    const closeUserBtn = document.getElementById('closeUserBtn');
    const overlay = document.getElementById('overlay');

    // Abre el menu del usuario. Mismo mecanismo que en navBar.js: 
    function openMenu() {
        sidebarUser.classList.add('active');
        overlay.classList.add('active');
    }

    // Cierra el menu: saca '.active'. El CSS devuelve el panel a
    function closeMenu() {
        sidebarUser.classList.remove('active');
        overlay.classList.remove('active');
    }

    /* Eventos, con las mismas guardas que navBar.js: este archivo se carga en
       paginas donde el boton de usuario puede no existir. */
    if (userBtn) {
        /* El boton de usuario del header. */
        userBtn.addEventListener('click', openMenu);
    }

    if (closeUserBtn) {
        /* La X de cerrar, adentro del panel de usuario. */
        closeUserBtn.addEventListener('click', closeMenu);
    }

    if (overlay) {
        // Click en el fondo oscuro para cerrar
        overlay.addEventListener('click', closeMenu);
    }
});