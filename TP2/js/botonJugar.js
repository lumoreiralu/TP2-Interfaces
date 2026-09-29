// Boton Jugar del carrusel 3D: se habilita cuando la barra de carga se llena
document.addEventListener('DOMContentLoaded', function () {
    const cards = document.querySelectorAll('.card-3d');
    if (!cards.length) return;

    // Si el usuario pide menos movimiento no tiene sentido frenar el click
    // con una barra: se habilita todo de una
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        cards.forEach(function (card) {
            const btn = card.querySelector('.btn-jugar');
            if (btn) {
                btn.dataset.listo = 'true';
                btn.disabled = false;
            }
        });
        return;
    }

    const puedeHover = window.matchMedia('(hover: hover)').matches;
    const DESTINO = 'gamePage/game.html';

    cards.forEach(function (card) {
        const btn = card.querySelector('.btn-jugar');
        const relleno = card.querySelector('.btn-jugar-relleno');
        if (!btn || !relleno) return;

        // En tactil no hay hover: la barra se sola y el click se habilita
        // con el animationend de mas abajo
        if (puedeHover) {
            card.addEventListener('mouseleave', function () {
                relleno.style.animation = 'none';
                btn.dataset.listo = 'false';
                btn.disabled = true;
            });

            card.addEventListener('mouseenter', function () {
                if (btn.dataset.listo === 'true') return;

                // Vuelve a disparar la animacion del CSS
                relleno.style.animation = '';
            });
        }

        // La animacion la hace el CSS, pero el click hay que habilitarlo desde JS
        relleno.addEventListener('animationend', function (e) {
            if (e.animationName === 'llenar-barra') {
                btn.dataset.listo = 'true';
                btn.disabled = false;
            }
        });

        btn.addEventListener('click', function () {
            if (btn.dataset.listo !== 'true') return;
            window.location.href = DESTINO;
        });
    });

    // Al rotar el carrusel cambia la card activa, asi que la barra de la que
    // estaba al frente se reinicia para no quedar habilitada a medias
    document.querySelectorAll('.btn-3d-nav').forEach(function (nav) {
        nav.addEventListener('click', function () {
            cards.forEach(function (card) {
                const btn = card.querySelector('.btn-jugar');
                const relleno = card.querySelector('.btn-jugar-relleno');
                if (!btn || !relleno) return;
                relleno.style.animation = 'none';
                btn.dataset.listo = 'false';
                btn.disabled = true;
            });
        });
    });
});
