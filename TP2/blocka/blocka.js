"use strict";

class BlockaGame {
    constructor() {
        this.canvas = document.getElementById("canvas");
        this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
        this.canvasFuente = document.createElement("canvas");
        this.canvasFuente.width = this.canvas.width;
        this.canvasFuente.height = this.canvas.height;
        this.ctxFuente = this.canvasFuente.getContext("2d");
        
        this.bancoImgenes = [
            "../assets/blocka/blocka1.png",
            "../assets/blocka/blocka2.png",
            "../assets/blocka/blocka3.png",
            "../assets/blocka/blocka4.png",
            "../assets/blocka/blocka5.png",
            "../assets/blocka/blocka6.png"
        ];

        this.nivelActual = 1;
        this.tiempoInicio = null;
        this.temporizadorInterval = null;
        this.imagenSeleccionada = null;
        this.piezas = [];
        this.juegoIniciado = false;
        this.nivelCompletado = false;
        this.mensajeVictoria = document.getElementById("blocka-mensaje");
        this.mostrarImagenInicial();
    }

    mostrarImagenInicial() {
        const imagenInicial = new Image();
        imagenInicial.onload = () => {
            if (!this.juegoIniciado) {
                this.ctx.drawImage(imagenInicial, 0, 0, this.canvas.width, this.canvas.height);
            }
        };
        imagenInicial.onerror = () => {
            console.error("No se pudo cargar la imagen inicial de Blocka.");
        };
        imagenInicial.src = "../assets/blocka/cardBlocka2.png";
    }

    iniciarNivel(nivel) {
        this.juegoIniciado = true;
        this.nivelCompletado = false;
        this.mensajeVictoria.hidden = true;
        this.mensajeVictoria.replaceChildren();
        this.nivelActual = nivel;
		// Actualizamos el texto del nivel en la interfaz (HTML)
        const lblNivel = document.getElementById("val-nivel");
        if (lblNivel) lblNivel.innerText = this.nivelActual;

        // Actualizamos o cargamos el récord guardado para este nivel
        this.actualizarVistaRecord();

        this.elegirImagenAleatoria();
        this.iniciarTemporizador();
    }

	actualizarVistaRecord() {
        const lblRecord = document.getElementById("val-record");
        if (lblRecord) {
            let recordGuardado = localStorage.getItem(`record_nivel_${this.nivelActual}`);
            lblRecord.innerText = recordGuardado ? `${recordGuardado}s` : "--:--";
        }
    }
	
    elegirImagenAleatoria() {
        const randomIndex = Math.floor(Math.random() * this.bancoImgenes.length);
        const rutaImagen = this.bancoImgenes[randomIndex];
        
        this.imagenSeleccionada = new Image();
        this.imagenSeleccionada.src = rutaImagen;
        
        this.imagenSeleccionada.onload = () => {
            this.configurarCanvasYFiltros();
        };
    }

    configurarCanvasYFiltros() {
        // 1. Dibujamos la imagen original en el canvas temporalmente para aplicar el filtro
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.imagenSeleccionada, 0, 0, this.canvas.width, this.canvas.height);

        let imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        // 2. Aplicar filtro según el nivel actual (Requisito: en tiempo de carga)
        switch(this.nivelActual) {
            case 1:
                this.filtroGrises(imageData);
                break;
            case 2:
                this.filtroBrillo(imageData, 30); // 30% de brillo
                break;
            case 3:
                this.filtroNegativo(imageData);
                break;
            default:
                this.filtroGrises(imageData);
        }

        // 3. Una vez filtrado todo el canvas, dividimos y mezclamos las piezas
        this.ctxFuente.drawImage(this.canvas, 0, 0);
        this.inicializarPiezas();
    }

    inicializarPiezas() {
        const anchoPieza = this.canvas.width / 2;  // 450
        const altoPieza = this.canvas.height / 2;   // 300

        this.piezas = [];

        let coordenadas = [
            { xOriginal: 0, yOriginal: 0, posX: 0, posY: 0 },
            { xOriginal: anchoPieza, yOriginal: 0, posX: anchoPieza, posY: 0 },
            { xOriginal: 0, yOriginal: altoPieza, posX: 0, posY: altoPieza },
            { xOriginal: anchoPieza, yOriginal: altoPieza, posX: anchoPieza, posY: altoPieza }
        ];

        coordenadas.forEach(coord => {
            // Ángulos aleatorios iniciales (90, 180, 270 para que no arranquen armadas)
            let angulosDisponibles = [90, 180, 270];
            let anguloAleatorio = angulosDisponibles[Math.floor(Math.random() * angulosDisponibles.length)];

            this.piezas.push({
                xOriginal: coord.xOriginal,
                yOriginal: coord.yOriginal,
                posX: coord.posX,
                posY: coord.posY,
                ancho: anchoPieza,
                alto: altoPieza,
                angulo: anguloAleatorio
            });
        });

        this.dibujarTablero();
        this.registrarEventosClick();
    }

    dibujarTablero() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.piezas.forEach(pieza => {
            this.ctx.save();
            
            let centroX = pieza.posX + pieza.ancho / 2;
            let centroY = pieza.posY + pieza.alto / 2;
            
            this.ctx.translate(centroX, centroY);
            this.ctx.rotate((pieza.angulo * Math.PI) / 180);
            
            this.ctx.drawImage(
                this.canvasFuente,
                pieza.xOriginal, pieza.yOriginal, pieza.ancho, pieza.alto,
                -pieza.ancho / 2, -pieza.alto / 2, pieza.ancho, pieza.alto
            );

            this.ctx.restore();
        });
    }

    registrarEventosClick() {
        this.canvas.onclick = (e) => this.manejarClick(e, 'izquierdo');
        this.canvas.oncontextmenu = (e) => {
            e.preventDefault(); // Evita menú contextual del navegador en click derecho
            this.manejarClick(e, 'derecho');
        };
    }

    manejarClick(e, tipoClick) {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        this.piezas.forEach(pieza => {
            if (clickX >= pieza.posX && clickX <= pieza.posX + pieza.ancho &&
                clickY >= pieza.posY && clickY <= pieza.posY + pieza.alto) {
                
                if (tipoClick === 'izquierdo') {
                    pieza.angulo = (pieza.angulo - 90 + 360) % 360; // Gira izquierda
                } else {
                    pieza.angulo = (pieza.angulo + 90) % 360;       // Gira derecha
                }
            }
        });

        this.dibujarTablero();
        this.verificarVictoria();
    }

	iniciarTemporizador() {
        clearInterval(this.temporizadorInterval);
        this.tiempoInicio = Date.now();
        
        this.temporizadorInterval = setInterval(() => {
            let tiempoTranscurrido = Math.floor((Date.now() - this.tiempoInicio) / 1000);
            
            // Formatear a MM:SS para que quede prolijo en `#val-tiempo`
            let minutos = String(Math.floor(tiempoTranscurrido / 60)).padStart(2, '0');
            let segundos = String(tiempoTranscurrido % 60).padStart(2, '0');
            
            const lblTiempo = document.getElementById("val-tiempo");
            if (lblTiempo) {
                lblTiempo.innerText = `${minutos}:${segundos}`;
            }
        }, 1000);
    }

    detenerTemporizador() {
        clearInterval(this.temporizadorInterval);
        return Math.floor((Date.now() - this.tiempoInicio) / 1000);
    }

    // --- FILTROS Y PIXELES ---
    filtroGrises(imageData) {
        var salida = this.ctx.createImageData(imageData.width, imageData.height);
        for (var x = 0; x < imageData.width; x++) {
            for (var y = 0; y < imageData.height; y++) {
                var r = this.getRed(imageData, x, y);
                var g = this.getGreen(imageData, x, y);
                var b = this.getBlue(imageData, x, y);
                var gris = (r + g + b) / 3;
                this.setPixel(salida, x, y, gris, gris, gris, 255);
            }
        }
        this.ctx.putImageData(salida, 0, 0);
    }

    filtroBrillo(imageData, porcentaje) {
        var salida = this.ctx.createImageData(imageData.width, imageData.height);
        let ajuste = 255 * (porcentaje / 100);
        for (var x = 0; x < imageData.width; x++) {
            for (var y = 0; y < imageData.height; y++) {
                var r = Math.min(255, this.getRed(imageData, x, y) + ajuste);
                var g = Math.min(255, this.getGreen(imageData, x, y) + ajuste);
                var b = Math.min(255, this.getBlue(imageData, x, y) + ajuste);
                this.setPixel(salida, x, y, r, g, b, 255);
            }
        }
        this.ctx.putImageData(salida, 0, 0);
    }

    filtroNegativo(imageData) {
        var salida = this.ctx.createImageData(imageData.width, imageData.height);
        for (var x = 0; x < imageData.width; x++) {
            for (var y = 0; y < imageData.height; y++) {
                var r = 255 - this.getRed(imageData, x, y);
                var g = 255 - this.getGreen(imageData, x, y);
                var b = 255 - this.getBlue(imageData, x, y);
                this.setPixel(salida, x, y, r, g, b, 255);
            }
        }
        this.ctx.putImageData(salida, 0, 0);
    }

    setPixel(imageData, x, y, r, g, b, a) {
        let index = (x + y * imageData.width) * 4;
        imageData.data[index + 0] = r;
        imageData.data[index + 1] = g;
        imageData.data[index + 2] = b;
        imageData.data[index + 3] = a;
    }

    getRed(imageData, x, y) {
        let index = (x + y * imageData.width) * 4;
        return imageData.data[index + 0];
    }

    getGreen(imageData, x, y) {
        let index = (x + y * imageData.width) * 4;
        return imageData.data[index + 1];
    }

    getBlue(imageData, x, y) {
        let index = (x + y * imageData.width) * 4;
        return imageData.data[index + 2];
    }

	verificarVictoria() {
        const ganado = this.piezas.every(pieza => pieza.angulo === 0);

        if (ganado && !this.nivelCompletado) {
            this.nivelCompletado = true;
            let tiempoFinal = this.detenerTemporizador();
            this.canvas.onclick = null;
            this.canvas.oncontextmenu = null;

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(this.imagenSeleccionada, 0, 0, this.canvas.width, this.canvas.height);

            let recordActual = localStorage.getItem(`record_nivel_${this.nivelActual}`);
            const nuevoRecord = !recordActual || tiempoFinal < parseInt(recordActual, 10);
            if (nuevoRecord) {
                localStorage.setItem(`record_nivel_${this.nivelActual}`, tiempoFinal);
                this.actualizarVistaRecord();
            }

            this.mensajeVictoria.hidden = false;
            const mensaje = document.createElement("span");
            mensaje.textContent = nuevoRecord
                ? `¡Nuevo récord! Nivel ${this.nivelActual} completado en ${tiempoFinal} segundos.`
                : `¡Felicitaciones! Nivel ${this.nivelActual} completado en ${tiempoFinal} segundos.`;
            this.mensajeVictoria.append(mensaje);

            if (this.nivelActual < 3) {
                const botonSiguiente = document.createElement("button");
                botonSiguiente.type = "button";
                botonSiguiente.className = "blocka-siguiente";
                botonSiguiente.textContent = `Continuar al nivel ${this.nivelActual + 1}`;
                botonSiguiente.addEventListener("click", () => this.iniciarNivel(this.nivelActual + 1));
                this.mensajeVictoria.append(botonSiguiente);
            } else {
                const mensajeFinal = document.createElement("span");
                mensajeFinal.textContent = " ¡Completaste todos los niveles!";
                this.mensajeVictoria.append(mensajeFinal);
            }
        }
    }


	
}
document.addEventListener("DOMContentLoaded", () => {
    const game = new BlockaGame();
    const btnStart = document.getElementById("startBlocka");
    
    if (btnStart) {

        btnStart.addEventListener("click", (e) => {
            e.preventDefault(); 
			const menuPrincipal = document.getElementById("menuPrincipal");
				if (menuPrincipal) {
					menuPrincipal.style.display = "none";
				}         
			const seccionJuego = document.getElementById("blocka-juego");
            if (seccionJuego) {
                seccionJuego.style.display = "flex";
            }
			   
            game.iniciarNivel(1);
        });
    } else {
        console.log("No se encontró el botón con ID startBlocka");
    }
});