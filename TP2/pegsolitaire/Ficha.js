/**
 * Representa una ficha interactiva dentro de un tablero o juego,
 * la cual hereda las propiedades base de la clase `Figura`.
 * Permite renderizar imágenes, manejar estados de arrastre y control de posición en una cuadrícula.
 */
class Ficha extends Figura { 
    /**
     * Crea una instancia de Ficha.
     * 
     * @param {number} posX - Posición inicial en el eje X.
     * @param {number} posY - Posición inicial en el eje Y.
     * @param {number} radio - Radio de la ficha circular.
     * @param {HTMLImageElement} imagen - Imagen que se dibujará dentro de la ficha.
     * @param {CanvasRenderingContext2D} contexto - Contexto de renderizado del canvas.
     * @param {number} fila - Fila actual de la matriz o tablero donde se ubica la ficha.
     * @param {number} columna - Columna actual de la matriz o tablero donde se ubica la ficha.
     */
    constructor(posX, posY, radio, imagen, contexto, fila, columna) {
        super(posX, posY, null, contexto);
        this.radio = radio; 
        this.imagen = imagen; 
        this.initialX = posX; 
        this.initialY = posY; 
        this.fila = fila; 
        this.columna = columna; 
        this.estaSiendoArrastrada = false;
    } 

    /**
     * Dibuja la ficha en el canvas. Incluye la imagen (si ya cargó correctamente)
     * y un anillo de resaltado si la ficha está siendo arrastrada por el usuario.
     */
    draw() { 
        super.draw(); 
        if (this.imagen && this.imagen.complete && this.imagen.naturalWidth > 0) { 
            this.context.drawImage( 
                this.imagen, 
                this.posX - this.radio, 
                this.posY - this.radio, 
                this.radio * 2, 
                this.radio * 2 
            ); 
        } 
        
        // Si la ficha está seleccionada (arrastrándose), dibujamos un anillo de resaltado 
        if (this.estaSiendoArrastrada) { 
            this.context.beginPath(); 
            this.context.arc(
                this.posX, 
                this.posY, 
                this.radio + 4, 0, 2 * Math.PI
            ); 
            this.context.strokeStyle = '#00ffff'; 
            this.context.lineWidth = 3; 
            this.context.stroke(); 
            this.context.closePath(); 
        } 
    } 

    /**
     * Restaura la posición de la ficha a su estado inicial previo al arrastre.
     */
    resetPosition() { 
        this.posX = this.initialX; 
        this.posY = this.initialY; 
    } 
        
    /**
     * Actualiza tanto la posición actual como la posición base inicial de la ficha,
     * así como su referencia en la fila y columna del tablero.
     * 
     * @param {number} newX - Nueva coordenada X.
     * @param {number} newY - Nueva coordenada Y.
     * @param {number} nuevaFila - Nueva fila en la matriz.
     * @param {number} nuevaCol - Nueva columna en la matriz.
     */
    updateInitialPosition(newX, newY, nuevaFila, nuevaCol) {
        this.posX = newX;
        this.posY = newY;
        this.initialX = newX;
        this.initialY = newY;
        this.fila = nuevaFila;
        this.columna = nuevaCol;
    }

    /**
     * Detecta si un punto (x, y) de las coordenadas del cursor o clic se encuentra 
     * dentro de los límites de la ficha circular.
     * Utiliza el cálculo de la distancia euclidiana entre dos puntos.
     * 
     * @param {number} x - Coordenada X del punto a evaluar.
     * @param {number} y - Coordenada Y del punto a evaluar.
     * @returns {boolean} True si el punto está dentro de la ficha, false en caso contrario.
     */
    isPointInside(x, y) { 
        let dx = this.posX - x; 
        let dy = this.posY - y; 
        return Math.sqrt(dx * dx + dy * dy) < this.radio; 
    }
}