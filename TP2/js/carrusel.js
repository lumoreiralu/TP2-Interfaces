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

        /* Los puntos de posicion los crea el JS y no el HTML: asi siguen
           la cantidad de cards si alguna vez se agrega o se saca una.
           Se cuelgan de la seccion (que es flex column) para que queden
           centrados abajo del coverflow */
        const dots = document.createElement('div');
        dots.className = 'destacado-dots';

        cards.forEach(function(card, i) {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'destacado-dot';
            dot.setAttribute('aria-label', 'Juego destacado ' + (i + 1));

            dot.addEventListener('click', function() {
                // Ir a ese juego es girar la cantidad de posiciones que
                // falta: el mismo camino que usan las flechas y el arrastre
                girar(i - activa);
            });

            dots.appendChild(dot);
        });

        contenedor.parentElement.appendChild(dots);

        function marcarDot(indice) {
            dots.querySelectorAll('.destacado-dot').forEach(function(dot, i) {
                dot.classList.toggle('activo', i === indice);
            });
        }

        function pintar() {
            cards.forEach(function(card, i) {
                for (let p = 0; p < posiciones.length; p++) {
                    card.classList.remove(posiciones[p]);
                }
                card.classList.add(posiciones[(i - activa + cards.length) % cards.length]);
            });

            marcarDot(activa);
        }

        // Un solo camino para girar: lo usan las flechas
        function girar(paso) {
            activa = (activa + paso + cards.length) % cards.length;
            pintar();
        }

        btnNext.addEventListener('click', function() {
            girar(1);
        });

        btnPrev.addEventListener('click', function() {
            girar(-1);
        });

        /* ---------- ARRASTRE (DEDO O MOUSE) ----------
           En mobile las flechas no entran, asi que el coverflow gira arrastrando,
           pero es el mismo coverflow de escritorio: se arrastra directo sobre la
           card de adelante (no sobre los dots) y el gesto vertical se deja pasar
           para poder scrollear la pagina.

           Se usan Pointer Events y no Touch Events porque asi el mismo codigo
           sirve para el dedo, el mouse y el stylus. Con touchstart/touchmove el
           arrastre con el mouse nooria porque esos eventos no existen.

           Durante el arrastre se escriben a mano las transformadas que el CSS
           pone con las clases .posicion-*: con un numero entero de posiciones
           de distancia sale exactamente la misma transformada, y con un
           numero fractional queda la card a medio camino. Al soltar se borran
           los estilos inline y el carrusel vuelve a girar por clases, asi el
           transition de carruselDestacado.css termina de acomodarlo. */

        // Distancia minima de arrastre, en fraccion de una posicion, para
        // que el gesto cuente como cambio de juego
        const UMBRAL = 0.35;

        let x0 = 0;
        let y0 = 0;
        let avance = 0;
        let puntero = null;

        // Cuanto hay que arrastrar para pasar de una posicion a la otra: el
        // 60% del ancho de la card, que es el desplazamiento que usa
        // translate3d(60%) de .posicion-derecha / .posicion-izquierda.
        // Con esa cuenta la card de adelante sigue al dedo 1:1
        function pasoPx() {
            const ancho = cards[0].offsetWidth;
            return ancho ? ancho * 0.6 : 0;
        }

        // A que transformada llega la card i segun cuantas posiciones este
        // del frente. Los valores son los de .posicion-activa,
        // .posicion-derecha e .posicion-izquierda, interpolados: en d = +-1
        // sale translate3d(60%, 0, -150px) rotateY(35deg) scale(.85) con
        // opacidad .4
        function escribir(card, d) {
            const lejos = Math.min(Math.abs(d), 1);

            card.style.transform =
                'translate3d(' + (d * 60) + '%, 0, ' + (-150 * lejos) + 'px) ' +
                'rotateY(' + (d * 35) + 'deg) ' +
                'scale(' + (1 - lejos * 0.15) + ')';

            card.style.opacity = 1 - lejos * 0.6;
            card.style.zIndex = 5 - Math.round(lejos * 3);
        }

        // Cuantas posiciones esta la card i del frente, en el circulo de 3:
        // en reposo sale lo que ya impone pintar(), y durante el gesto queda
        // a medio camino entre dos posiciones
        function posicionesDe(i) {
            const n = cards.length;
            const d = (i - activa) - avance;
            return d - n * Math.round(d / n);
        }

        // Al soltar se limpian los estilos inline: las cards vuelven a tomar
        // la transformada de su clase .posicion-* y el transition del CSS
        // termina de acomodarlas
        function soltar() {
            const paso = avance >= UMBRAL ? 1 : (avance <= -UMBRAL ? -1 : 0);

            cards.forEach(function(card) {
                card.style.transform = '';
                card.style.opacity = '';
                card.style.zIndex = '';
                card.style.transition = '';
            });

            puntero = null;
            avance = 0;

            if (paso) girar(paso);
            else pintar();
        }

        /* El arrastre se registra solo en mobile, que es donde no hay flechas.
           El breakpoint es el mismo de mobile.css: en escritorio siguen
           mandando unicamente las flechas */
        if (window.matchMedia('(max-width: 768px)').matches) {
            contenedor.addEventListener('pointerdown', function(e) {
                // Solo el primer puntero: un segundo dedo no reinicia el gesto
                if (!e.isPrimary || puntero !== null) return;

                // Con mouse solo el boton izquierdo arrastra
                if (e.pointerType === 'mouse' && e.button !== 0) return;

                // El gesto arranca sobre el START: eso es un click, no arrastre
                if (e.target.closest('.btn-start')) return;

                // setPointerCapture: los pointermove siguen llegando aunque el
                // cursor o el dedo se salgan de la card
                puntero = e.pointerId;
                contenedor.setPointerCapture(e.pointerId);

                x0 = e.clientX;
                y0 = e.clientY;
                avance = 0;

                // Sin transition mientras se arrastra, o la card se queda atras
                cards.forEach(function(card) {
                    card.style.transition = 'none';
                });
            });

            contenedor.addEventListener('pointermove', function(e) {
                if (puntero === null || e.pointerId !== puntero) return;

                const dx = e.clientX - x0;
                const dy = e.clientY - y0;

                // Gesto vertical: no se toca nada y el scroll de la pagina sigue
                if (Math.abs(dy) > Math.abs(dx)) {
                    soltar();
                    return;
                }

                // Gesto horizontal: se avisa al navegador antes de que scrollee
                if (e.cancelable) e.preventDefault();

                const paso = pasoPx();
                if (!paso) return;

                // Arrastrar a la derecha (dx > 0) trae la card de la izquierda.
                // Se limita a una sola posicion: con solo 3 cards, un arrastre mas
                // largo daria la vuelta al circulo y al soltar la card volveria
                // para atras
                avance = Math.max(-1, Math.min(1, -dx / paso));

                cards.forEach(function(card, i) {
                    escribir(card, posicionesDe(i));
                });

                marcarDot((Math.round(activa + avance) % cards.length + cards.length) % cards.length);
            });

            contenedor.addEventListener('pointerup', function(e) {
                if (e.pointerId !== puntero) return;
                contenedor.releasePointerCapture(e.pointerId);
                soltar();
            });

            contenedor.addEventListener('pointercancel', function(e) {
                if (e.pointerId !== puntero) return;
                soltar();
            });
        }

        pintar();
    }

    iniciarComunes();
    iniciarDestacado();
});
