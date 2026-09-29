// Carruseles: desplazamiento con rebote en los comunes y suave en el destacado
document.addEventListener('DOMContentLoaded', function() {

    // Si el usuario pide menos movimiento, saltamos las animaciones
    const sinAnimacion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Cuantas tarjetas avanza el carrusel en cada click
    const PASO_CARDS = 3;

    // Amplitud del rebote. El seno amortiguado solo alcanza el 70% de esto
    const REBOTE = 70;
    const PICO = REBOTE * 0.70;

    // Reparto de la duracion: 40% deslizamiento, 60% rebote
    const GLIDE = 0.4;
    const DURACION = 620;

    // Deslizamiento: avanza rapido y frena. Es la primera fase
    function easeOutQuad(t) {
        return 1 - Math.pow(1 - t, 2);
    }

    // Rebote amortiguado: se pasa del objetivo, vuelve y se asienta.
    // u va de 0 a 1 y devuelve cuantos px se pasa del objetivo
    function rebote(u) {
        return REBOTE * Math.sin(2 * Math.PI * u) * Math.pow(1 - u, 2);
    }

    // Escribe la posicion sin que el scroll-behavior: smooth del CSS
    // se ponga a animar al mismo tiempo y peleen las dos cosas
    function setScroll(track, left) {
        track.scrollTo({ left: left, behavior: 'instant' });
    }

    // Anima el track hasta la posicion objetivo
    function animarScroll(track, objetivo, conRebote, alTerminar) {
        const desde = track.scrollLeft;
        const delta = objetivo - desde;

        if (delta === 0) {
            if (alTerminar) alTerminar();
            return;
        }

        if (sinAnimacion) {
            setScroll(track, objetivo);
            if (alTerminar) alTerminar();
            return;
        }

        // El navegador recorta el scroll en los bordes. Si hay lugar para
        // pasarse del objetivo el rebote va hacia adelante; si no, va hacia
        // atras, y asi la fila choca contra el limite y vuelve
        const max = track.scrollWidth - track.clientWidth;
        let signo = 0;
        if (conRebote) {
            if (objetivo + PICO <= max) signo = 1;
            else if (objetivo - PICO >= 0) signo = -1;
        }

        const t0 = performance.now();

        // Si el usuario sigue clicking, se cancela la animacion anterior
        // y la nueva arranca desde donde quedo el track
        if (track.raf) cancelAnimationFrame(track.raf);

        function paso(ahora) {
            const t = Math.min((ahora - t0) / DURACION, 1);
            let valor;

            // Primera fase: deslizamiento hasta el objetivo
            if (t < GLIDE) {
                valor = desde + delta * easeOutQuad(t / GLIDE);

            // Segunda fase: rebote alrededor del objetivo ya alcanzado
            } else {
                valor = objetivo + signo * rebote((t - GLIDE) / (1 - GLIDE));
            }

            // El clamp es red de seguridad, por si la ventana cambia de
            // ancho a mitad de la animacion
            setScroll(track, Math.max(0, Math.min(valor, max)));

            if (t < 1) {
                track.raf = requestAnimationFrame(paso);
            } else {
                track.raf = null;
                if (alTerminar) alTerminar();
            }
        }

        track.raf = requestAnimationFrame(paso);
    }

    // ---------- Carruseles comunes (rebote) ----------

    function iniciarComunes() {
        const secciones = document.querySelectorAll('.seccion-carrusel');

        secciones.forEach(function(seccion) {
            const track = seccion.querySelector('.carrusel-track');
            const btnPrev = seccion.querySelector('.btn-carrusel-prev');
            const btnNext = seccion.querySelector('.btn-carrusel-next');

            if (!track || !btnPrev || !btnNext) return;

            // Distancia entre tarjeta y tarjeta (ancho + gap real del CSS).
            // Sirve para que las tarjetas queden alineadas al aterrizar
            function calcularSalto() {
                const tarjetas = track.querySelectorAll('.juego-tarjeta');
                if (tarjetas.length > 1) {
                    return tarjetas[1].offsetLeft - tarjetas[0].offsetLeft;
                }
                return track.clientWidth;
            }

            // Al llegar al extremo se apaga la flecha de ese lado
            function actualizarBotones() {
                const max = track.scrollWidth - track.clientWidth;
                btnPrev.disabled = track.scrollLeft <= 0;
                btnNext.disabled = track.scrollLeft >= max - 1;
            }

            function mover(direccion) {
                const salto = calcularSalto();
                const max = track.scrollWidth - track.clientWidth;

                // Cada click avanza PASO_CARDS tarjetas hacia el lado pedido
                let objetivo = track.scrollLeft + direccion * salto * PASO_CARDS;

                // El paso ya es multiplo de una tarjeta, pero el redondeo
                // mantiene la alineacion si PASO_CARDS se cambia
                objetivo = Math.round(objetivo / salto) * salto;
                objetivo = Math.max(0, Math.min(objetivo, max));

                // El rebote lo anima animarScroll, y al terminar se releen
                // los botones porque el track quedo en la posicion final
                animarScroll(track, objetivo, true, actualizarBotones);
            }

            btnPrev.addEventListener('click', function() {
                mover(-1);
            });

            btnNext.addEventListener('click', function() {
                mover(1);
            });

            // Al cambiar el ancho de la ventana cambia cuanto hay para scrollear
            window.addEventListener('resize', actualizarBotones);

            actualizarBotones();
        });
    }

    // ---------- Carrusel del juego destacado (suave) ----------

    function iniciarDestacado() {
        const contenedor = document.querySelector('.carrusel-3d-contenedor');
        if (!contenedor) return;

        const cards = contenedor.querySelectorAll('.card-3d');
        const btnPrev = contenedor.querySelector('.btn-3d-nav.prev');
        const btnNext = contenedor.querySelector('.btn-3d-nav.next');

        if (!cards.length || !btnPrev || !btnNext) return;

        // Solo se rotan las clases: el suavizado lo pone el CSS
        // (transition: transform 0.5s ease de carruselDestacado.css)
        const posiciones = ['posicion-activa', 'posicion-derecha', 'posicion-izquierda'];

        // Se respeta la tarjeta que ya viene activa en el HTML, para que
        // pintar() al arrancar no deforme la disposicion inicial
        let activa = 0;
        cards.forEach(function(card, i) {
            if (card.classList.contains('posicion-activa')) activa = i;
        });

        function pintar() {
            cards.forEach(function(card, i) {
                for (let p = 0; p < posiciones.length; p++) {
                    card.classList.remove(posiciones[p]);
                }
                card.classList.add(posiciones[(i - activa + cards.length) % cards.length]);
            });
        }

        btnNext.addEventListener('click', function() {
            activa = (activa + 1) % cards.length;
            pintar();
        });

        btnPrev.addEventListener('click', function() {
            activa = (activa - 1 + cards.length) % cards.length;
            pintar();
        });

        pintar();
    }

    iniciarComunes();
    iniciarDestacado();
});
