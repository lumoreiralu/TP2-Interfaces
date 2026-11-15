"use strict";

class PacBird {
    constructor() {
        // Medidas del escenario y físicas (px y px/s)
        this.ANCHO = 900;
        this.ALTO = 600;
        this.GRAVEDAD = 1600;
        this.IMPULSO = 520;
        this.VEL_BASE = 220;
        this.DT_MAX = 0.05;
        this.FACTORES = [0.1, 0.25, 0.5, 1];

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

        this.capas = Array.from(document.querySelectorAll(".capa")).map((el, indice) => ({
            el,
            factor: parseFloat(el.dataset.factor) || this.FACTORES[indice] || 0,
            anchoTile: parseInt(el.dataset.anchoTile, 10) || this.ANCHO,
            x: 0
        }));

        this.sprites = {};
        this.listo = false;
        this.juego = { estado: "menu", puntos: 0, vidas: 3, tiempo: 0 };
        this.entrada = { impulso: false };
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

        for (const capa of this.capas) {
            capa.x = (capa.x + this.VEL_BASE * capa.factor * dt) % capa.anchoTile;
            if (capa.x < 0) capa.x += capa.anchoTile;
        }

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
    }

    actualizarHud() {
        if (this.hudPuntos) this.hudPuntos.textContent = this.juego.puntos;
        if (this.hudVidas) this.hudVidas.textContent = this.juego.vidas;
    }

    mostrarPantalla(estado) {
        this.juego.estado = estado;
        if (this.escenario) this.escenario.classList.toggle("esta-jugando", estado === "jugando");
        if (this.menuInicio) this.menuInicio.hidden = estado !== "menu";
        if (this.menuFin) this.menuFin.hidden = estado !== "fin";
    }

    empezar() {
        if (this.juego.estado === "jugando") return;
        this.juego.puntos = 0;
        this.juego.vidas = 3;
        this.juego.tiempo = 0;
        this.jugador = this.crearJugador();
        this.jugador.vy = -this.IMPULSO * 0.7;
        this.actualizarHud();
        this.mostrarPantalla("jugando");
    }

    reiniciar() {
        this.juego.estado = "fin";
        this.empezar();
    }

    finalizar() {
        if (this.juego.estado !== "jugando") return;
        this.mostrarPantalla("fin");
        if (this.finDetalle) {
            this.finDetalle.textContent = `Puntos: ${this.juego.puntos}`;
        }
    }

    volverAlMenu() {
        this.jugador = this.crearJugador();
        this.juego.puntos = 0;
        this.juego.vidas = 3;
        this.juego.tiempo = 0;
        this.actualizarHud();
        this.mostrarPantalla("menu");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new PacBird();
});
