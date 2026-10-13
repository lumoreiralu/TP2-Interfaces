"use strict";
// Controla los carruseles comunes y el carrusel destacado del home
// Incluye desplazamiento con rebote en los carruseles comunes
document.addEventListener('DOMContentLoaded', function() {

    const sinAnimacion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // //: es el mismo query que el @media

    const PASO_CARDS = 3;

    // Amplitud del rebote, en PIXELES. Es cuanto se pasa del objet
    const REBOTE = 70;
    // PICO es el rebote maximo REAL que se usa para decidir de que
    const PICO = REBOTE * 0.70;

    // Reparto de la DURACION TOTAL entre las dos fases del movimie
    const GLIDE = 0.4;
    // DURACION TOTAL del movimiento, en milisegundos. 620 = 0.62s.
    const DURACION = 620;

    // Curva de la PRIMERA fase (el deslizamiento hasta el objetivo
    function easeOutQuad(t) {
        return 1 - Math.pow(1 - t, 2);
    }

    // Curva de la SEGUNDA fase (el rebote alrededor del objetivo).
    function rebote(u) {
        return REBOTE * Math.sin(2 * Math.PI * u) * Math.pow(1 - u, 2);
    }

    // Escribe la posicion del scroll en UN frame, de golpe.
    function setScroll(track, left) {
        track.scrollTo({ left: left, behavior: 'instant' });
    }

    // MOTOR: anima la fila hasta 'objetivo' cuadro a cuadro.
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

        // Si el usuario sigue clickeando, se cancela la animacion ante
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

    // ============================================================
    function iniciarComunes() {
        const secciones = document.querySelectorAll('.seccion-carrusel');

        secciones.forEach(function(seccion) {
            const track = seccion.querySelector('.carrusel-track');
            const btnPrev = seccion.querySelector('.btn-carrusel-prev');
            const btnNext = seccion.querySelector('.btn-carrusel-next');

            if (!track || !btnPrev || !btnNext) return;

            // Distancia entre tarjeta y tarjeta, en pixeles (ancho + el ga
            function calcularSalto() {
                const tarjetas = track.querySelectorAll('.juego-tarjeta');
                if (tarjetas.length > 1) {
                    return tarjetas[1].offsetLeft - tarjetas[0].offsetLeft;
                }
                return track.clientWidth;
            }

            // Al llegar al extremo se deshabilita la flecha de ese lado.
            function actualizarBotones() {
                const max = track.scrollWidth - track.clientWidth;
                btnPrev.disabled = track.scrollLeft <= 0;
                btnNext.disabled = track.scrollLeft >= max - 1;
            }

            // Mueve el carrusel un 'paso' hacia la izquierda (-1) o la der
            function mover(direccion) {
                const salto = calcularSalto();
                const max = track.scrollWidth - track.clientWidth;

                // Cada click avanza PASO_CARDS tarjetas hacia el lado pedido
                let objetivo = track.scrollLeft + direccion * salto * PASO_CARDS;

                // El paso ya es multiplo de una tarjeta, pero el redondeo
                // mantiene la alineacion si PASO_CARDS se cambia
                objetivo = Math.round(objetivo / salto) * salto;
                objetivo = Math.max(0, Math.min(objetivo, max));

                // Se le pasa 'true' (con rebote) y actualizarBotones como
                animarScroll(track, objetivo, true, actualizarBotones);
            }

            btnPrev.addEventListener('click', function() {
                mover(-1);
            });

            btnNext.addEventListener('click', function() {
                mover(1);
            });

            // Al cambiar el ancho de la ventana cambia cuanto hay para
            window.addEventListener('resize', actualizarBotones);

            actualizarBotones();
        });
    }

    // ============================================================
    function iniciarDestacado() {
        const contenedor = document.querySelector('.carrusel-3d-contenedor');
        if (!contenedor) return;

        const cards = contenedor.querySelectorAll('.card-3d');
        const btnPrev = contenedor.querySelector('.btn-3d-nav.prev');
        const btnNext = contenedor.querySelector('.btn-3d-nav.next');

        if (!cards.length || !btnPrev || !btnNext) return;

        // Solo se rotan las clases: el suavizado lo pone el CSS
        const posiciones = ['posicion-activa', 'posicion-derecha', 'posicion-izquierda'];

        // 'activa' es el indice de la tarjeta de adelante (0, 1, 2...)
        let activa = 0;
        cards.forEach(function(card, i) {
            if (card.classList.contains('posicion-activa')) activa = i;
        });

        // Los puntos de posicion los crea el JS y no el HTML: asi sigu
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

        // Marca el punto activo: le pone .activo al correcto y se la s
        function marcarDot(indice) {
            dots.querySelectorAll('.destacado-dot').forEach(function(dot, i) {
                dot.classList.toggle('activo', i === indice);
            });
        }

        // PINTA: el unico lugar donde se escriben las clases de posici
        function pintar() {
            cards.forEach(function(card, i) {
                for (let p = 0; p < posiciones.length; p++) {
                    card.classList.remove(posiciones[p]);
                }
                card.classList.add(posiciones[(i - activa + cards.length) % cards.length]);
            });

            marcarDot(activa);
        }

        // Un solo camino para girar: lo usan las flechas, los dots y e
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

        // ---------- ARRASTRE (DEDO O MOUSE) ----------

        // Distancia minima de arrastre, en FRACCION de una posicion, p
        const UMBRAL = 0.35;

        // Estado del gesto en curso. Son 4 variables sueltas en vez de
        let x0 = 0;
        let y0 = 0;
        let avance = 0;
        let puntero = null;

        // Cuanto hay que arrastrar para pasar de una posicion a la otra: el
        // 60% del ancho de la card, que es el desplazamiento que usa
        // translate3d(60%) de .posicion-derecha / .posicion-izquierda.
        // Con esa cuenta la card de adelante sigue al dedo 1:1
        // Cuanto hay que arrastrar, en PIXELES, para pasar de una posi
        function pasoPx() {
            const ancho = cards[0].offsetWidth;
            return ancho ? ancho * 0.6 : 0;
        }

        // A que transformada llega la card i segun cuantas posiciones este
        // del frente. Los valores son los de .posicion-activa,
        // .posicion-derecha e .posicion-izquierda, interpolados: en d = +-1
        // sale translate3d(60%, 0, -150px) rotateY(35deg) scale(.85) con
        // opacidad .4
        // Escribe la transformada de UNA card mientras se arrastra.
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
        // A cuantas posiciones del frente esta la card i, en este fram
        function posicionesDe(i) {
            const n = cards.length;
            const d = (i - activa) - avance;
            return d - n * Math.round(d / n);
        }

        // SOLTAR: el final de cualquier gesto (finger up, mouse up o c
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

        // El arrastre se registra SOLO en mobile, que es donde no hay 
        if (window.matchMedia('(max-width: 768px)').matches) {
            // pointerdown: arranca el gesto. guarda la posicion
            contenedor.addEventListener('pointerdown', function(e) {
                /* Solo el primer puntero: un segundo dedo no reinicia el
                   gesto. 'puntero !== null' quiere decir 'ya hay un dedo
                  started este arrastre'. */
                if (!e.isPrimary || puntero !== null) return;

                if (e.pointerType === 'mouse' && e.button !== 0) return;

                // Si el gesto arranca sobre el boton START, no es arrastre: es
                if (e.target.closest('.btn-start')) return;

                // setPointerCapture: le dice al navegador 'segui mandandome
                puntero = e.pointerId;
                contenedor.setPointerCapture(e.pointerId);

                x0 = e.clientX;
                y0 = e.clientY;
                avance = 0;

                /* Sin transicion mientras se arrastra, o la card se queda
                   atras. Se escribe 'inline', o sea que pisa al transition de
                   carruselDestacado.css. Se limpia en soltar() (mas abajo). */
                cards.forEach(function(card) {
                    card.style.transition = 'none';
                });
            });

            contenedor.addEventListener('pointermove', function(e) {
                if (puntero === null || e.pointerId !== puntero) return;

                /* dx / dy son cuantos pixeles se movio el dedo desde que
                   arranco el gesto (clientX/Y es la posicion del puntero en
                   pantalla; x0/y0 es donde se toco). */
                const dx = e.clientX - x0;
                const dy = e.clientY - y0;

                // Gesto vertical: se cancela el arrastre y se devuelve el
                if (Math.abs(dy) > Math.abs(dx)) {
                    soltar();
                    return;
                }

                // Gesto horizontal: se le avisa al navegador que este
                if (e.cancelable) e.preventDefault();

                const paso = pasoPx();
                if (!paso) return;

                // 'avance' es la fraccion de posicion que se movio la card, de
                avance = Math.max(-1, Math.min(1, -dx / paso));

                cards.forEach(function(card, i) {
                    escribir(card, posicionesDe(i));
                });

                // El punto activo se calcula con 'activa + avance' y no con la
                marcarDot((Math.round(activa + avance) % cards.length + cards.length) % cards.length);
            });

            // pointerup: el dedo o el boton del mouse se levantaron.
            contenedor.addEventListener('pointerup', function(e) {
                if (e.pointerId !== puntero) return;
                contenedor.releasePointerCapture(e.pointerId);
                soltar();
            });

            // pointercancel: el navegador corto el gesto (el usuario empez
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
