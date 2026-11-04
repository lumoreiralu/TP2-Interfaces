/**
 * Clase principal que gestiona el flujo del juego (tablero, fichas, renderizado, 
 * eventos de interacción, temporizador y menús de interfaz).
 */
class Juego { 
    /**
     * Crea una instancia del Juego.
     * 
     * @param {string} canvasId - ID del elemento <canvas> en el DOM donde se renderizará el juego.
     */
    constructor(canvasId) { 
        this.canvas = document.getElementById(canvasId); 
        this.ctx = this.canvas.getContext('2d'); 

        // Geometría medida sobre tablero.png (1024x1024) y sus 33 casillas en cruz.
        const escalaX = this.canvas.width / 1024;
        const escalaY = this.canvas.height / 1024;
        this.cellWidth = 104.929 * escalaX;
        this.cellHeight = 93.018 * escalaY;
        this.offsetX = 147.321 * escalaX;
        this.offsetY = 145.080 * escalaY;

        this.modelo = new Tablero(); 
        this.fichas = []; 
        this.fichaSeleccionada = null; 
        this.movimientosSugeridos = [];

        // Elementos del menú de inicio, fin de partida y temporizador
        this.menuInicio = document.getElementById('game-start-menu');
        this.menuFin = document.getElementById('game-end-menu');
        this.timerElemento = document.getElementById('game-timer');
        this.mensajeFin = document.getElementById('game-end-message');
        this.tiempoFinalElemento = document.getElementById('final-time');
        this.btnPlay = document.getElementById('btn-play');
        this.btnReplay = document.getElementById('btn-replay');
        this.btnRestart = document.getElementById('btn-restart');

        this.iniciado = false;
        this.terminado = false;
        this.tiempoLimiteSegundos = 180;
        this.segundosRestantes = this.tiempoLimiteSegundos;
        this.intervaloTimer = null;
        this.tiempoFin = null;
        this.rippleInicio = 0;
        this.rippleRAF = null;
        
        this.bgImage = new Image();
        this.bgImage.onload = () => this.drawAll();
        this.bgImage.src = '../assets/pegPacmanPage/fichasytablero/tablero.png';

        this.skins = {
            pacman: '../assets/pegPacmanPage/fichasytablero/pacman.png',
            fantasma: '../assets/pegPacmanPage/fichasytablero/fantasma.png'
        };
        
        const skinSeleccionada = document.querySelector('input[name="ficha-skin"]:checked');
        this.currentSkinSrc = skinSeleccionada && this.skins[skinSeleccionada.value]
            ? this.skins[skinSeleccionada.value]
            : this.skins.pacman;
            
        this.fichaImage = new Image();
        this.fichaImageSrc = this.currentSkinSrc;

        this.fichaImage.onload = () => {
            this.drawAll();
        };
        this.fichaImage.src = this.fichaImageSrc;
        this.inicializarFichasDesdeModelo();
        this.actualizarTimer();
        this.drawAll();
        this.initEvents();
    }

    /**
     * Traduce coordenadas en píxeles (x, y) a una posición de celda en la matriz {f, c}.
     * 
     * @param {number} x - Coordenada X en píxeles.
     * @param {number} y - Coordenada Y en píxeles.
     * @returns {{f: number, c: number}|null} Objeto con fila y columna, o null si está fuera de rango.
     */
    pixelAMatriz(x, y) {
        const c = Math.floor((x - this.offsetX) / this.cellWidth);
        const f = Math.floor((y - this.offsetY) / this.cellHeight);
        if (f >= 0 && f < 7 && c >= 0 && c < 7) {
            return { f, c };
        }
        return null;
    }

    /**
     * Traduce una celda de la matriz {f, c} a las coordenadas centrales en píxeles del canvas.
     * 
     * @param {number} f - Índice de la fila.
     * @param {number} c - Índice de la columna.
     * @returns {{x: number, y: number}} Coordenadas centrales en píxeles.
     */
    matrizAPixel(f, c) {
        return {
            x: this.offsetX + c * this.cellWidth + this.cellWidth / 2, 
            y: this.offsetY + f * this.cellHeight + this.cellHeight / 2
        };
    }

    /**
     * Inicializa y sincroniza la lista de objetos `Ficha` basándose en el estado de la matriz del modelo.
     */
    inicializarFichasDesdeModelo() { 
        this.fichas = []; 
        const radio = Math.min(this.cellWidth, this.cellHeight) * 0.3; 
        for (let r = 0; r < 7; r++) { 
            for (let c = 0; c < 7; c++) { 
                if (this.modelo.matriz[r][c] === 1) { 
                    const posPixel = this.matrizAPixel(r, c); 
                    const ficha = new Ficha(posPixel.x, posPixel.y, radio, this.fichaImage, this.ctx, r, c); 
                    this.fichas.push(ficha); 
                } 
            } 
        } 
    }

    /**
     * Configura y registra los listeners de eventos para el canvas, botones y selector de skins.
     */
    initEvents() { 
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e)); 
        window.addEventListener('mousemove', (e) => this.onMouseMove(e)); 
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));

        const skinInputs = document.querySelectorAll('input[name="ficha-skin"]');
        skinInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.cambiarSkin(e.target.value);
                }
            });
        });

        if (this.btnPlay) {
            this.btnPlay.addEventListener('click', () => this.iniciarJuego());
        }
        if (this.btnReplay) {
            this.btnReplay.addEventListener('click', () => this.reiniciarJuego());
        }
        if (this.btnRestart) {
            this.btnRestart.addEventListener('click', () => this.reiniciarJuego());
        }
    }

    /**
     * Inicia o reanuda la partida, ocultando menús y activando el temporizador.
     */
    iniciarJuego() {
        this.iniciado = true;
        this.terminado = false;
        this.segundosRestantes = this.tiempoLimiteSegundos;
        this.actualizarTimer();
        if (this.menuInicio) {
            this.menuInicio.hidden = true;
        }
        if (this.menuFin) {
            this.menuFin.hidden = true;
        }
        if (this.btnRestart) {
            this.btnRestart.hidden = false;
        }
        this.iniciarTimer();
    }

    /**
     * Reinicia por completo el estado del juego, el tablero y el tiempo.
     */
    reiniciarJuego() {
        this.detenerTimer();
        this.cancelarSeleccion();
        this.modelo.reset();
        this.inicializarFichasDesdeModelo();
        this.drawAll();
        this.iniciarJuego();
    }

    /**
     * Inicia el intervalo del temporizador de la partida.
     */
    iniciarTimer() {
        this.detenerTimer();
        this.tiempoFin = Date.now() + this.segundosRestantes * 1000;
        this.intervaloTimer = setInterval(() => this.actualizarTiempoRestante(), 250);
    }

    /**
     * Actualiza los segundos restantes basándose en el tiempo actual del sistema.
     */
    actualizarTiempoRestante() {
        if (this.tiempoFin === null || this.terminado) {
            return;
        }
        this.segundosRestantes = Math.max(0, Math.ceil((this.tiempoFin - Date.now()) / 1000));
        this.actualizarTimer();
        if (this.segundosRestantes === 0) {
            this.detenerTimer();
            this.cancelarSeleccion();
            this.finalizarJuego('tiempo');
            this.drawAll();
        }
    }

    /**
     * Detiene el intervalo del temporizador activo.
     */
    detenerTimer() {
        if (this.intervaloTimer) {
            clearInterval(this.intervaloTimer);
            this.intervaloTimer = null;
        }
    }

    /**
     * Actualiza la representación visual del temporizador en el DOM y gestiona alertas de tiempo bajo.
     */
    actualizarTimer() {
        if (this.timerElemento) {
            const texto = `Tiempo restante: ${this.formatearTiempo(this.segundosRestantes)}`;
            if (this.timerElemento.textContent !== texto) {
                this.timerElemento.textContent = texto;
            }
            const enAdvertencia = this.iniciado && !this.terminado && this.segundosRestantes <= 30;
            this.timerElemento.classList.toggle('game-timer-warning', enAdvertencia);
        }
    }

    /**
     * Cancela la selección actual de la ficha y la devuelve a su posición original.
     */
    cancelarSeleccion() {
        if (this.fichaSeleccionada) {
            this.fichaSeleccionada.estaSiendoArrastrada = false;
            this.fichaSeleccionada.resetPosition();
        }
        this.fichaSeleccionada = null;
        this.movimientosSugeridos = [];
        this.detenerRipples();
    }

    /**
     * Formatea una cantidad de segundos a formato de texto "MM:SS".
     * 
     * @param {number} segundos - Segundos totales.
     * @returns {string} Tiempo formateado.
     */
    formatearTiempo(segundos) {
        const minutos = Math.floor(segundos / 60).toString().padStart(2, '0');
        const resto = (segundos % 60).toString().padStart(2, '0');
        return `${minutos}:${resto}`;
    }

    /**
     * Inicia la animación de ondas expansivas (ripples) para los movimientos sugeridos.
     */
    iniciarRipples() {
        this.rippleInicio = performance.now();
        if (this.rippleRAF !== null) {
            return;
        }
        const animar = () => {
            if (this.movimientosSugeridos.length === 0) {
                this.rippleRAF = null;
                return;
            }
            this.drawAll();
            this.rippleRAF = requestAnimationFrame(animar);
        };
        this.rippleRAF = requestAnimationFrame(animar);
    }

    /**
     * Detiene la animación de ondas expansivas.
     */
    detenerRipples() {
        if (this.rippleRAF !== null) {
            cancelAnimationFrame(this.rippleRAF);
            this.rippleRAF = null;
        }
    }

    /**
     * Finaliza la partida actual, mostrando el menú final y deteniendo interacciones.
     * 
     * @param {string} [motivo='fin'] - Motivo de finalización ('tiempo' u otro).
     */
    finalizarJuego(motivo = 'fin') {
        if (this.terminado) {
            return;
        }
        this.terminado = true;
        this.detenerTimer();
        this.detenerRipples();
        this.actualizarTimer();
        const tiempoFinal = this.formatearTiempo(this.segundosRestantes);
        const fichasRestantes = this.modelo.contarFichasRestantes();
        
        if (this.mensajeFin) {
            if (motivo === 'tiempo') {
                this.mensajeFin.textContent = '¡Se acabó el tiempo!';
            } else if (fichasRestantes === 1) {
                this.mensajeFin.textContent = '¡Excelente! Dejaste una sola ficha en el tablero.';
            } else {
                this.mensajeFin.textContent = 'No quedan más movimientos posibles.';
            }
        }
        if (this.tiempoFinalElemento) {
            this.tiempoFinalElemento.textContent = tiempoFinal;
        }
        if (this.menuFin) {
            this.menuFin.hidden = false;
        }
        if (this.btnRestart) {
            this.btnRestart.hidden = true;
        }
        console.log("[CONTROLADOR] El juego ha finalizado. Motivo:", motivo, "Tiempo restante:", tiempoFinal);
    }

    /**
     * Obtiene las coordenadas relativas del cursor dentro del canvas escalado.
     * 
     * @param {MouseEvent} e - Evento del mouse.
     * @returns {{x: number, y: number}} Coordenadas escaladas (x, y).
     */
    getCanvasCoordinates(e) { 
        const rect = this.canvas.getBoundingClientRect(); 
        return {
            x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (e.clientY - rect.top) * (this.canvas.height / rect.height)
        }; 
    }

    /**
     * Maneja el evento de presión del botón del mouse (`mousedown`) para seleccionar fichas.
     * 
     * @param {MouseEvent} e - Evento del mouse.
     */
    onMouseDown(e) { 
        if (!this.iniciado || this.terminado) {
            return;
        }
        const mouse = this.getCanvasCoordinates(e); 
        for (let i = this.fichas.length - 1; i >= 0; i--) { 
            const ficha = this.fichas[i]; 
            if (ficha.isPointInside(mouse.x, mouse.y)) { 
                this.fichaSeleccionada = ficha; 
                this.fichaSeleccionada.estaSiendoArrastrada = true; 
                this.movimientosSugeridos = this.modelo.obtenerMovimientosPosibles(ficha.fila, ficha.columna); 
                console.log("[CONTROLADOR] Ficha cliqueada en:", { f: ficha.fila, c: ficha.columna }, "Movimientos posibles:", this.movimientosSugeridos);
                if (this.movimientosSugeridos.length > 0) {
                    this.iniciarRipples();
                }
                this.drawAll(); 
                break; 
            } 
        } 
    }

    /**
     * Maneja el movimiento del mouse (`mousemove`) para actualizar la posición de la ficha arrastrada.
     * 
     * @param {MouseEvent} e - Evento del mouse.
     */
    onMouseMove(e) { 
        if (this.fichaSeleccionada && this.fichaSeleccionada.estaSiendoArrastrada) { 
            const mouse = this.getCanvasCoordinates(e); 
            this.fichaSeleccionada.setPosition(mouse.x, mouse.y); 
            this.drawAll(); 
        } 
    }

    /**
     * Maneja la liberación del botón del mouse (`mouseup`) para validar y ejecutar movimientos en el tablero.
     * 
     * @param {MouseEvent} e - Evento del mouse.
     */
    onMouseUp(e) { 
        if (!this.fichaSeleccionada || !this.fichaSeleccionada.estaSiendoArrastrada) 
            return; 
        if (this.terminado) {
            this.cancelarSeleccion();
            this.drawAll();
            return;
        }
        const mouse = this.getCanvasCoordinates(e); 
        const destinoMatriz = this.pixelAMatriz(mouse.x, mouse.y); 
        const origenMatriz = { 
            f: this.fichaSeleccionada.fila, 
            c: this.fichaSeleccionada.columna 
        }; 

        if (destinoMatriz && this.modelo.esMovimientoValido(origenMatriz, destinoMatriz)) {
            const fichaComidaCoords = this.modelo.ejecutarMovimiento(origenMatriz, destinoMatriz); 
            this.fichas = this.fichas.filter(f => !(f.fila === fichaComidaCoords.f && f.columna === fichaComidaCoords.c));
            const nuevoPixel = this.matrizAPixel(destinoMatriz.f, destinoMatriz.c); 
            this.fichaSeleccionada.updateInitialPosition(nuevoPixel.x, nuevoPixel.y, destinoMatriz.f, destinoMatriz.c); 
            if (this.modelo.esJuegoTerminado()) { 
                this.finalizarJuego(); 
            } 
        } else { 
            console.log("[CONTROLADOR] Movimiento inválido. La ficha regresa a su posición original."); 
            this.fichaSeleccionada.resetPosition(); 
        } 
        this.fichaSeleccionada.estaSiendoArrastrada = false; 
        this.fichaSeleccionada = null; 
        this.movimientosSugeridos = []; 
        this.detenerRipples();
        this.drawAll(); 
    }

    /**
     * Limpia el canvas y redibuja todos los elementos visuales (fondo, huecos, hints y fichas).
     */
    drawAll() { 
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.bgImage.complete) { 
            this.ctx.drawImage(this.bgImage, 0, 0, this.canvas.width, this.canvas.height); 
        } 
        
        this.drawHuecosYHints(); 
        
        const fichasQuietas = this.fichas.filter(f => !f.estaSiendoArrastrada); 
        fichasQuietas.forEach(f => f.draw()); 
        
        if (this.fichaSeleccionada && this.fichaSeleccionada.estaSiendoArrastrada) { 
            this.fichaSeleccionada.draw(); 
        } 
    }

    /**
     * Dibuja los huecos vacíos del tablero y las sugerencias de movimiento (hints) con ondas dinámicas.
     */
    drawHuecosYHints() { 
        const radioBase = Math.min(this.cellWidth, this.cellHeight);
        for (let r = 0; r < 7; r++) { 
            for (let c = 0; c < 7; c++) {
                if (this.modelo.matriz[r][c] !== undefined) { 
                    const pos = this.matrizAPixel(r, c); 
                    if (this.modelo.matriz[r][c] === 0) { 
                        this.ctx.beginPath(); 
                        this.ctx.arc(pos.x, pos.y, radioBase * 0.22, 0, 2 * Math.PI); 
                        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; 
                        this.ctx.fill(); 
                        this.ctx.closePath(); 
                    } 
                } 
            } 
        } 

        const tiempo = this.rippleInicio
            ? (performance.now() - this.rippleInicio) / 1000
            : 0;
            
        this.movimientosSugeridos.forEach((dest, indice) => {
            const pos = this.matrizAPixel(dest.f, dest.c);
            const pulso = 0.5 + 0.5 * Math.sin(tiempo * 5 + indice);

            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, radioBase * 0.32, 0, 2 * Math.PI);
            this.ctx.fillStyle = `rgba(0, 255, 128, ${0.2 + pulso * 0.1})`;
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();
            this.ctx.closePath();

            [0, 0.5].forEach(desfase => {
                const progreso = ((tiempo / 1.2) + desfase + indice * 0.08) % 1;
                const radio = radioBase * (0.22 + progreso * 0.36);
                const alpha = (1 - progreso) * 0.55;

                this.ctx.beginPath();
                this.ctx.arc(pos.x, pos.y, radio, 0, 2 * Math.PI);
                this.ctx.strokeStyle = `rgba(0, 255, 160, ${alpha})`;
                this.ctx.lineWidth = 2.5 * (1 - progreso) + 0.5;
                this.ctx.stroke();
                this.ctx.closePath();
            });
        });
    }

    /**
     * Cambia la apariencia (skin/imagen) de todas las fichas en tiempo de ejecución.
     * 
     * @param {string} skinKey - Clave identificadora de la skin ('pacman', 'fantasma', etc.).
     */
    cambiarSkin(skinKey) { 
        const skinSrc = this.skins[skinKey];
        if (!skinSrc) {
            return;
        }
        this.currentSkinSrc = skinSrc;
        this.fichaImageSrc = skinSrc;
        const imagen = new Image();
        this.fichaImage = imagen;
        imagen.onload = () => {
            if (this.currentSkinSrc !== skinSrc) {
                return;
            }
            this.fichas.forEach(f => f.imagen = imagen);
            this.drawAll();
        };
        imagen.src = skinSrc;
    }
}