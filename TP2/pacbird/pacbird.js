"use strict";

class PacBird {
    constructor() {
        // Medidas del escenario y físicas (px y px/s)
        this.ANCHO = 810;
        this.ALTO = 510;
        this.GRAVEDAD = 1600;
        this.IMPULSO = 520;
        this.VEL_BASE = 220;
        this.DT_MAX = 0.05;
        this.FACTORES = [0.1, 0.25, 0.5, 1];

        // Pilares (obstáculos)
        this.ANCHO_TUBO = 80;
        this.HUECO_INICIAL = 210;
        this.HUECO_MIN = 120;
        this.REDUCCION_HUECO = 10;
        this.INTERVALO_REDUCCION = 7;
        this.MARGEN_SUP = 70;
        this.MARGEN_INF = 90;
        this.DISTANCIA_MIN = 240;
        this.DISTANCIA_MAX = 420;

        // Vidas e invulnerabilidad
        this.VIDAS_INICIALES = 10;
        this.ALTO_PISO = 72;
        this.TIEMPO_INVULNERABLE = 2;
        this.tiempoInvulnerable = 0;
        this.muriendo = false;
        this.timerMuerte = null;

        // Ítem de energía (bola amarilla)
        this.TAMANO_ITEM = 26;
        this.PUNTOS_ITEM = 50;
        this.ITEM_TIEMPO_MIN = 6;
        this.ITEM_TIEMPO_MAX = 12;
        this.TIEMPO_PEQUENO = 5;
        this.tiempoPequeno = 0;
        this.tiempoSiguienteItem = 0;

        // Fantasma multicolor (poder temporal)
        this.TAMANO_FANTASMA = 36;
        this.FANTASMA_MARGEN = 40;
        this.FANTASMA_ZONA = 110;
        this.COLUMNAS_POR_FANTASMA = 4;
        this.TIEMPO_FANTASMA = 6;
        this.UMBRAL_PARPADEO_FANTASMA = 2;
        this.MULTIPLICADOR_FANTASMA = 2;
        this.tiempoFantasma = 0;
        this.fantasmas = [];
        this.columnasCreadas = 0;

        // Rutas reservadas: cuando existan los assets reales se cargan solos.
        this.MANIFIESTO = {
            fondo1: "../assets/pacbird/fondo1.png",
            fondo2: "../assets/pacbird/fondo2.png",
            fondo3: "../assets/pacbird/fondo3.png",
            fondo4: "../assets/pacbird/fondo4.png",
            pacman: "../assets/pacbird/pacman.png",
            tubo: "../assets/pacbird/tubo.png",
            fantasma: "../assets/pacbird/fantasma.png",
            item: "../assets/pacbird/item.png"
        };

        this.escenario = document.getElementById("escenario");
        this.jugadorEl = document.getElementById("jugador");
        this.jugadorSprite = document.getElementById("jugadorSprite");
        this.hudPuntos = document.getElementById("hudPuntos");
        this.hudVidas = document.getElementById("hudVidas");
        this.menuInicio = document.getElementById("menuInicio");
        this.menuFin = document.getElementById("menuFin");
        this.finDetalle = document.getElementById("finDetalle");
        this.btnStart = document.getElementById("btnStart");
        this.btnReintentar = document.getElementById("btnReintentar");
        this.btnVolverMenu = document.getElementById("btnVolverMenu");
        this.contenedorTubos = document.getElementById("tubos");
        this.contenedorFantasmas = document.getElementById("fantasmas");
        this.contenedorPuntos = document.getElementById("puntosFlotantes");

        this.capas = Array.from(document.querySelectorAll(".capa")).map((el, indice) => ({
            el,
            factor: parseFloat(el.dataset.factor) || this.FACTORES[indice] || 0,
            anchoTile: parseInt(el.dataset.anchoTile, 10) || this.ANCHO,
            x: 0
        }));

        this.sprites = {};
        this.listo = false;
        this.juego = { estado: "menu", puntos: 0, vidas: this.VIDAS_INICIALES, tiempo: 0 };
        this.entrada = { impulso: false };
        this.tubos = [];
        this.distancia = 320;
        this.jugador = this.crearJugador();
        this.anterior = performance.now();

        this.configurarEntrada();
        this.iniciar();
    }

    crearJugador() {
        return {
            x: 150,
            y: this.ALTO / 2 - 22,
            vy: 0,
            ancho: 44,
            alto: 44,
            angulo: 0
        };
    }

    azar(min, max) {
        return min + Math.random() * (max - min);
    }

    velocidadActual() {
        return this.VEL_BASE * (this.tiempoFantasma > 0 ? this.MULTIPLICADOR_FANTASMA : 1);
    }

    crearTubo() {
        const reducciones = Math.floor(this.juego.tiempo / this.INTERVALO_REDUCCION);
        const huecoBase = this.HUECO_INICIAL - reducciones * this.REDUCCION_HUECO;
        const hueco = Math.max(this.HUECO_MIN, huecoBase + this.azar(-20, 25));

        const minCentro = this.MARGEN_SUP + hueco / 2;
        const maxCentro = this.ALTO - this.MARGEN_INF - hueco / 2;
        const centro = this.azar(minCentro, maxCentro);

        const el = this.crearTuboEl(centro, hueco);
        const x = this.ANCHO + 40;
        const anterior = this.tubos[this.tubos.length - 1];

        this.tubos.push({ x, centro, hueco, el, puntuado: false });
        this.distancia = this.azar(this.DISTANCIA_MIN, this.DISTANCIA_MAX);
        this.columnasCreadas += 1;

        if (this.columnasCreadas % this.COLUMNAS_POR_FANTASMA === 0 && anterior) {
            this.crearFantasma((anterior.x + x) / 2);
        }
    }

    crearTuboEl(centro, hueco) {
        const tubo = document.createElement("div");
        tubo.className = "tubo";

        const arriba = document.createElement("div");
        arriba.className = "tubo-parte tubo-arriba";
        arriba.style.height = `${centro - hueco / 2}px`;

        const abajo = document.createElement("div");
        abajo.className = "tubo-parte tubo-abajo";
        abajo.style.height = `${this.ALTO - (centro + hueco / 2)}px`;

        tubo.appendChild(arriba);
        tubo.appendChild(abajo);

        if (this.contenedorTubos) this.contenedorTubos.appendChild(tubo);
        return tubo;
    }

    crearFantasma(xCentro) {
        if(!this.jugadorEl.classList.contains("poder") && !this.jugadorEl.classList.contains("poder-parpadeo")) {
            const enArriba = Math.random() < 0.5;
            const y = enArriba
                ? this.azar(this.FANTASMA_MARGEN, this.FANTASMA_MARGEN + this.FANTASMA_ZONA)
                : this.azar(
                    this.ALTO - this.ALTO_PISO - this.FANTASMA_MARGEN - this.FANTASMA_ZONA,
                    this.ALTO - this.ALTO_PISO - this.FANTASMA_MARGEN
                );

            const el = document.createElement("div");
            el.className = "fantasma";
            if (this.contenedorFantasmas) this.contenedorFantasmas.appendChild(el);

            this.fantasmas.push({ x: xCentro, y, el });
        }
    }

    actualizarFantasmas(dt) {
        const velocidad = this.velocidadActual();
        for (const fantasma of this.fantasmas) {
            fantasma.x -= velocidad * dt;
        }

        while (this.fantasmas.length > 0 && this.fantasmas[0].x < -this.TAMANO_FANTASMA) {
            const viejo = this.fantasmas.shift();
            if (viejo.el && viejo.el.remove) viejo.el.remove();
        }
    }

    hitboxFantasma(fantasma) {
        const mitad = this.TAMANO_FANTASMA / 2;
        return {
            x: fantasma.x - mitad,
            y: fantasma.y - mitad,
            w: this.TAMANO_FANTASMA,
            h: this.TAMANO_FANTASMA
        };
    }

    verificarFantasmas() {
        const caja = this.hitboxJugador();

        for (let i = this.fantasmas.length - 1; i >= 0; i--) {
            const fantasma = this.fantasmas[i];
            if (!this.choca(caja, this.hitboxFantasma(fantasma))) continue;

            if (fantasma.el && fantasma.el.remove) fantasma.el.remove();
            this.fantasmas.splice(i, 1);
            this.activarPoderFantasma();
        }
    }

    limpiarFantasmas() {
        for (const fantasma of this.fantasmas) {
            if (fantasma.el && fantasma.el.remove) fantasma.el.remove();
        }
        this.fantasmas = [];
        this.columnasCreadas = 0;
    }

    reiniciarTemporizadorItem() {
        this.tiempoSiguienteItem = this.azar(this.ITEM_TIEMPO_MIN, this.ITEM_TIEMPO_MAX);
    }

    actualizarItem(dt) {
        this.tiempoSiguienteItem -= dt;
        if (this.tiempoSiguienteItem > 0) return;

        this.reiniciarTemporizadorItem();
        this.crearItemEnTubo();
    }

    crearItemEnTubo() {
        const candidatos = this.tubos.filter((tubo) =>
            !tubo.itemEl && tubo.x > this.jugador.x + 100
        );
        if (candidatos.length === 0) return;

        const tubo = candidatos[Math.floor(Math.random() * candidatos.length)];
        const el = document.createElement("div");
        el.className = "tubo-item";
        el.style.top = `${tubo.centro}px`;

        tubo.itemEl = el;
        tubo.el.appendChild(el);
    }

    actualizarTubos(dt) {
        const velocidad = this.velocidadActual();

        this.distancia -= velocidad * dt;
        if (this.distancia <= 0) this.crearTubo();

        for (const tubo of this.tubos) {
            tubo.x -= velocidad * dt;
        }

        while (this.tubos.length > 0 && this.tubos[0].x < -this.ANCHO_TUBO) {
            const viejo = this.tubos.shift();
            if (viejo.el && viejo.el.remove) viejo.el.remove();
        }
    }

    verificarPuntos() {
        for (const tubo of this.tubos) {
            if (tubo.puntuado) continue;
            if (tubo.x + this.ANCHO_TUBO < this.jugador.x) {
                tubo.puntuado = true;
                this.juego.puntos += 20;
                this.actualizarHud();
                this.mostrarPuntos(20, tubo.x + this.ANCHO_TUBO / 2, tubo.centro);
            }
        }
    }

    hitboxItem(tubo) {
        const mitad = this.TAMANO_ITEM / 2;
        return {
            x: tubo.x + this.ANCHO_TUBO / 2 - mitad,
            y: tubo.centro - mitad,
            w: this.TAMANO_ITEM,
            h: this.TAMANO_ITEM
        };
    }

    verificarItems() {
        const caja = this.hitboxJugador();
        for (const tubo of this.tubos) {
            if (!tubo.itemEl) continue;
            if (this.choca(caja, this.hitboxItem(tubo))) {
                this.recogerItem(tubo);
            }
        }
    }

    recogerItem(tubo) {
        if (!tubo.itemEl) return;

        if (tubo.itemEl.remove) tubo.itemEl.remove();
        tubo.itemEl = null;

        this.juego.puntos += this.PUNTOS_ITEM;
        this.actualizarHud();
        this.mostrarPuntos(this.PUNTOS_ITEM, tubo.x + this.ANCHO_TUBO / 2, tubo.centro);
        this.activarPequeno();
    }

    mostrarPuntos(cantidad, x, y) {
        if (!this.contenedorPuntos) return;

        const el = document.createElement("span");
        el.className = "punto-flotante";
        el.textContent = `+${cantidad}`;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        this.contenedorPuntos.appendChild(el);

        el.addEventListener("animationend", () => el.remove(), { once: true });
        setTimeout(() => {
            if (el.parentNode) el.remove();
        }, 1200);
    }

    limpiarPuntos() {
        if (this.contenedorPuntos) this.contenedorPuntos.replaceChildren();
    }

    limpiarTubos() {
        for (const tubo of this.tubos) {
            if (tubo.el && tubo.el.remove) tubo.el.remove();
        }
        this.tubos = [];
        this.distancia = 320;
    }

    hitboxJugador() {
        const margen = this.tiempoPequeno > 0 ? 13 : 6;
        return {
            x: this.jugador.x + margen,
            y: this.jugador.y + margen,
            w: this.jugador.ancho - margen * 2,
            h: this.jugador.alto - margen * 2
        };
    }

    hitboxesTubo(tubo) {
        const bordeSuperior = tubo.centro - tubo.hueco / 2;
        const bordeInferior = tubo.centro + tubo.hueco / 2;
        return [
            { x: tubo.x, y: 0, w: this.ANCHO_TUBO, h: bordeSuperior },
            { x: tubo.x, y: bordeInferior, w: this.ANCHO_TUBO, h: this.ALTO - bordeInferior }
        ];
    }

    choca(a, b) {
        return a.x < b.x + b.w &&
            a.x + a.w > b.x &&
            a.y < b.y + b.h &&
            a.y + a.h > b.y;
    }

    verificarColisiones() {
        if (this.esInvulnerable()) return;

        const caja = this.hitboxJugador();
        const piso = { x: 0, y: this.ALTO - this.ALTO_PISO, w: this.ANCHO, h: this.ALTO_PISO };

        if (this.choca(caja, piso)) {
            this.recibirImpacto("piso");
            return;
        }

        for (const tubo of this.tubos) {
            const [arriba, abajo] = this.hitboxesTubo(tubo);
            if (this.choca(caja, arriba) || this.choca(caja, abajo)) {
                this.recibirImpacto("tubo");
                return;
            }
        }
    }

    recibirImpacto(tipo) {
        if (this.juego.vidas <= 1) {
            this.juego.vidas = 0;
            this.actualizarHud();
            this.morir(tipo);
            return;
        }

        this.juego.vidas -= 1;
        this.actualizarHud();
        this.iniciarInvulnerabilidad();

        if (tipo === "piso") {
            this.jugador.y = this.ALTO - this.ALTO_PISO - this.jugador.alto - 1;
            this.jugador.vy = -this.IMPULSO * 0.65;
        }
    }

    morir(tipo) {
        if (this.muriendo) return;
        this.muriendo = true;
        if (this.jugadorEl) this.jugadorEl.classList.add("desintegrando");
        this.timerMuerte = setTimeout(() => this.finalizar(tipo), 1000);
    }

    cancelarMuerte() {
        if (this.timerMuerte) {
            clearTimeout(this.timerMuerte);
            this.timerMuerte = null;
        }
        this.muriendo = false;
        if (this.jugadorEl) this.jugadorEl.classList.remove("desintegrando");
    }

    iniciarInvulnerabilidad() {
        this.tiempoInvulnerable = this.TIEMPO_INVULNERABLE;
        if (this.jugadorEl) this.jugadorEl.classList.add("invulnerable");
    }

    detenerInvulnerabilidad() {
        this.tiempoInvulnerable = 0;
        if (this.jugadorEl) this.jugadorEl.classList.remove("invulnerable");
    }

    activarPequeno() {
        this.tiempoPequeno = this.TIEMPO_PEQUENO;
        if (this.jugadorEl) this.jugadorEl.classList.add("chico");
    }

    desactivarPequeno() {
        this.tiempoPequeno = 0;
        if (this.jugadorEl) this.jugadorEl.classList.remove("chico");
    }

    actualizarPequeno(dt) {
        if (this.tiempoPequeno <= 0) return;

        this.tiempoPequeno = Math.max(0, this.tiempoPequeno - dt);
        if (this.tiempoPequeno === 0) this.desactivarPequeno();
    }

    activarPoderFantasma() {
        this.tiempoFantasma = this.TIEMPO_FANTASMA;
        if (this.jugadorEl) {
            this.jugadorEl.classList.add("poder");
            this.jugadorEl.classList.remove("poder-parpadeo");
        }
    }

    desactivarPoderFantasma() {
        this.tiempoFantasma = 0;
        if (this.jugadorEl) {
            this.jugadorEl.classList.remove("poder");
            this.jugadorEl.classList.remove("poder-parpadeo");
        }
    }

    actualizarPoderFantasma(dt) {
        if (this.tiempoFantasma <= 0) return;

        this.tiempoFantasma = Math.max(0, this.tiempoFantasma - dt);

        if (this.tiempoFantasma === 0) {
            this.desactivarPoderFantasma();
        } else if (this.tiempoFantasma <= this.UMBRAL_PARPADEO_FANTASMA && this.jugadorEl) {
            this.jugadorEl.classList.add("poder-parpadeo");
        }
    }

    esInvulnerable() {
        return this.tiempoInvulnerable > 0 || this.tiempoFantasma > 0;
    }

    async iniciar() {
        if (this.btnStart) this.btnStart.disabled = true;
        await this.precargarSprites();
        this.aplicarSprites();
        this.listo = true;
        if (this.btnStart) this.btnStart.disabled = false;
        this.mostrarPantalla("menu");
        this.actualizarHud();
        this.dibujar();
        this.anterior = performance.now();
        requestAnimationFrame((ahora) => this.frame(ahora));
    }

    cargarImagen(src) {
        return new Promise((resolver) => {
            const img = new Image();
            img.onload = () => resolver(img);
            img.onerror = () => resolver(null);
            img.src = src;
        });
    }

    async precargarSprites() {
        const claves = Object.keys(this.MANIFIESTO);
        const imagenes = await Promise.all(
            claves.map((clave) => this.cargarImagen(this.MANIFIESTO[clave]))
        );

        this.sprites = {};
        claves.forEach((clave, indice) => {
            if (imagenes[indice]) this.sprites[clave] = imagenes[indice];
        });
    }

    aplicarSprites() {
        if (this.sprites.pacman && this.jugadorSprite) {
            this.jugadorSprite.src = this.sprites.pacman.src;
            this.jugadorEl.classList.add("con-sprite");
        }

        this.capas.forEach((capa) => {
            const img = this.sprites[capa.el.dataset.sprite];
            if (!img) return;
            capa.el.style.backgroundImage = `url("${img.src}")`;
            capa.el.style.backgroundSize = "auto 100%";
        });
    }

    configurarEntrada() {
        window.addEventListener("keydown", (e) => {
            if (e.repeat) return;
            const objetivo = e.target;
            if (objetivo instanceof HTMLElement &&
                (objetivo.tagName === "INPUT" || objetivo.tagName === "TEXTAREA" || objetivo.isContentEditable)) {
                return;
            }
            const esImpulso = e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW";
            if (!esImpulso) return;
            e.preventDefault();
            this.entrada.impulso = true;
        });

        if (this.escenario) {
            this.escenario.addEventListener("pointerdown", (e) => {
                if (e.target.closest("button") || e.target.closest("a")) return;
                e.preventDefault();
                this.escenario.focus();
                this.entrada.impulso = true;
            });
        }

        if (this.btnStart) this.btnStart.addEventListener("click", () => this.empezar());
        if (this.btnReintentar) this.btnReintentar.addEventListener("click", () => this.reiniciar());
        if (this.btnVolverMenu) this.btnVolverMenu.addEventListener("click", () => this.volverAlMenu());
    }

    frame(ahora) {
        let dt = (ahora - this.anterior) / 1000;
        this.anterior = ahora;
        dt = Math.min(dt, this.DT_MAX);

        switch (this.juego.estado) {
            case "menu":
                if (this.entrada.impulso) this.empezar();
                break;
            case "jugando":
                this.actualizar(dt);
                break;
            case "fin":
                if (this.entrada.impulso) this.reiniciar();
                break;
        }

        this.entrada.impulso = false;
        this.dibujar();
        requestAnimationFrame((tiempo) => this.frame(tiempo));
    }

    actualizar(dt) {
        if (this.muriendo) return;
        this.actualizarPoderFantasma(dt);

        if (this.tiempoInvulnerable > 0) {
            this.tiempoInvulnerable = Math.max(0, this.tiempoInvulnerable - dt);
            if (this.tiempoInvulnerable === 0 && this.jugadorEl) {
                this.jugadorEl.classList.remove("invulnerable");
            }
        }

        this.actualizarPequeno(dt);

        if (this.entrada.impulso) {
            this.jugador.vy = -this.IMPULSO;
            this.entrada.impulso = false;
        }

        this.jugador.vy += this.GRAVEDAD * dt;
        this.jugador.y += this.jugador.vy * dt;

        const piso = this.ALTO - this.jugador.alto;
        if (this.jugador.y < 0) {
            this.jugador.y = 0;
            this.jugador.vy = 0;
        }
        if (this.jugador.y > piso) {
            this.jugador.y = piso;
            this.jugador.vy = 0;
        }

        this.jugador.angulo = Math.max(-25, Math.min(70, this.jugador.vy * 0.06));

        const velocidad = this.velocidadActual();
        for (const capa of this.capas) {
            capa.x = (capa.x + velocidad * capa.factor * dt) % capa.anchoTile;
            if (capa.x < 0) capa.x += capa.anchoTile;
        }

        this.actualizarTubos(dt);
        this.actualizarFantasmas(dt);
        this.actualizarItem(dt);
        this.verificarPuntos();
        this.verificarItems();
        this.verificarFantasmas();
        this.verificarColisiones();

        if (this.juego.estado !== "jugando") return;

        this.juego.tiempo += dt;
    }

    dibujar() {
        const j = this.jugador;
        if (this.jugadorEl) {
            this.jugadorEl.style.transform =
                `translate3d(${j.x}px, ${j.y}px, 0) rotate(${j.angulo}deg)`;
        }

        for (const capa of this.capas) {
            capa.el.style.backgroundPositionX = `${-capa.x}px`;
        }

        for (const tubo of this.tubos) {
            tubo.el.style.transform = `translate3d(${tubo.x}px, 0, 0)`;
        }

        const mitadFantasma = this.TAMANO_FANTASMA / 2;
        for (const fantasma of this.fantasmas) {
            fantasma.el.style.transform =
                `translate3d(${fantasma.x - mitadFantasma}px, ${fantasma.y - mitadFantasma}px, 0)`;
        }
    }

    actualizarHud() {
        if (this.hudPuntos) this.hudPuntos.textContent = this.juego.puntos;

        if (this.hudVidas) {
            const corazones = [];
            for (let i = 0; i < this.VIDAS_INICIALES; i++) {
                const corazon = document.createElement("span");
                const lleno = i < this.juego.vidas;
                corazon.className = lleno ? "corazon" : "corazon corazon-vacio";
                corazon.innerHTML =
                    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
                corazon.setAttribute("role", "img");
                corazon.setAttribute("aria-label", lleno ? "Vida" : "Vida perdida");
                corazones.push(corazon);
            }
            this.hudVidas.replaceChildren(...corazones);
        }
    }

    mostrarPantalla(estado) {
        this.juego.estado = estado;
        if (this.escenario) this.escenario.classList.toggle("esta-jugando", estado === "jugando");
        if (this.menuInicio) this.menuInicio.hidden = estado !== "menu";
        if (this.menuFin) this.menuFin.hidden = estado !== "fin";
    }

    empezar() {
        if (this.juego.estado === "jugando") return;
        this.cancelarMuerte();
        this.juego.puntos = 0;
        this.juego.vidas = this.VIDAS_INICIALES;
        this.juego.tiempo = 0;
        this.jugador = this.crearJugador();
        this.jugador.vy = -this.IMPULSO * 0.7;
        this.detenerInvulnerabilidad();
        this.desactivarPequeno();
        this.desactivarPoderFantasma();
        this.reiniciarTemporizadorItem();
        this.limpiarPuntos();
        this.limpiarFantasmas();
        this.limpiarTubos();
        this.crearTubo();
        this.actualizarHud();
        this.mostrarPantalla("jugando");
    }

    reiniciar() {
        this.juego.estado = "fin";
        this.empezar();
    }

    finalizar(tipo = "tubo") {
        if (this.juego.estado !== "jugando") return;
        this.cancelarMuerte();
        this.detenerInvulnerabilidad();
        this.desactivarPoderFantasma();
        this.mostrarPantalla("fin");
        if (this.finDetalle) {
            const motivo = tipo === "piso" ? "contra el piso" : "con un pilar";
            this.finDetalle.textContent = `Chocaste ${motivo}. Puntos: ${this.juego.puntos}`;
        }
    }

    volverAlMenu() {
        this.cancelarMuerte();
        this.detenerInvulnerabilidad();
        this.desactivarPequeno();
        this.desactivarPoderFantasma();
        this.reiniciarTemporizadorItem();
        this.limpiarPuntos();
        this.limpiarFantasmas();
        this.limpiarTubos();
        this.jugador = this.crearJugador();
        this.juego.puntos = 0;
        this.juego.vidas = this.VIDAS_INICIALES;
        this.juego.tiempo = 0;
        this.actualizarHud();
        this.mostrarPantalla("menu");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new PacBird();
});
