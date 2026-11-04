class Figura { 
    constructor(posX, posY, fill, context) {
        this.posX = posX; 
        this.posY = posY; 
        this.fill = fill; 
        this.context = context; 
    } 

    // Define la posición actual de la figura en el canvas 
    setPosition(x, y) { 
        this.posX = x; 
        this.posY = y; 
    }

    //Retorna las coordenadas actuales
    getPosition() { 
        return { 
            x: this.posX, y: this.posY
        }; 
    } 

    // Método base para dibujar (establece el estilo de relleno si aplica)
    draw() { 
        if (this.fill) { 
            this.context.fillStyle = this.fill; 
        }
    } 
    //Método abstracto para verificar si un punto (x, y) está dentro de la figura
    isPointInside(x, y) { 
        return false;
    } 
}