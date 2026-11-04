/**
 * Representa el modelo lógico del tablero (Peg Solitaire), gestionando 
 * la matriz de estados, la validación de movimientos y las reglas del juego.
 */
class Tablero { 
    /**
     * Crea una instancia del Tablero e inicializa la matriz con su estado inicial.
     */
    constructor() { 
        this.matriz = []; 
        this.reset(); 
    }

    /**
     * Restablece la matriz del tablero a su configuración inicial del juego 
     * (con las fichas en '1', el centro vacío en '0' y las esquinas inválidas en `undefined`).
     */
    reset() { 
        const U = undefined;
        this.matriz = [ 
            [U, U, 1, 1, 1, U, U], 
            [U, U, 1, 1, 1, U, U], 
            [1, 1, 1, 1, 1, 1, 1], 
            [1, 1, 1, 0, 1, 1, 1], 
            [1, 1, 1, 1, 1, 1, 1], 
            [U, U, 1, 1, 1, U, U], 
            [U, U, 1, 1, 1, U, U] 
        ]; 
    } 

    /**
     * Verifica si una posición (fila, columna) se encuentra dentro de los límites 
     * del tablero y corresponde a una celda jugable (diferente de `undefined`).
     * 
     * @param {number} f - Índice de la fila.
     * @param {number} c - Índice de la columna.
     * @returns {boolean} True si la posición es válida y jugable, false en caso contrario.
     */
    esPosicionValida(f, c) { 
        return f >= 0 && f < 7 && c >= 0 && c < 7 && this.matriz[f][c] !== undefined; 
    }

    /**
     * Valida si un movimiento desde una celda de origen a una de destino cumple 
     * con las reglas del juego (salto sobre una ficha adyacente hacia un espacio vacío).
     * 
     * @param {{f: number, c: number}} origen - Coordenadas de origen {f, c}.
     * @param {{f: number, c: number}} destino - Coordenadas de destino {f, c}.
     * @returns {boolean} True si el movimiento es válido, false en caso contrario.
     */
    esMovimientoValido(origen, destino) { 
        if (!this.esPosicionValida(origen.f, origen.c) || !this.esPosicionValida(destino.f, destino.c)) 
            return false; 
            
        // Origen debe ser 1 (ficha) y Destino debe ser 0 (vacío) 
        if (this.matriz[origen.f][origen.c] !== 1 || this.matriz[destino.f][destino.c] !== 0) {
            return false; 
        } 
        
        const df = destino.f - origen.f; 
        const dc = destino.c - origen.c; 
        const esVertical = Math.abs(df) === 2 && dc === 0; 
        const esHorizontal = Math.abs(dc) === 2 && df === 0; 
        
        if (!esVertical && !esHorizontal) 
            return false; 
            
        // Verificar que en el casillero del medio haya una ficha (1) 
        const middleF = origen.f + df / 2; 
        const middleC = origen.c + dc / 2; 
        return this.matriz[middleF][middleC] === 1;
    }

    /**
     * Ejecuta un movimiento válido en el tablero, actualizando los estados de las celdas 
     * (origen y celda intermedia vacías, destino con ficha) y retornando la posición de la ficha comida.
     * 
     * @param {{f: number, c: number}} origen - Coordenadas de origen {f, c}.
     * @param {{f: number, c: number}} destino - Coordenadas de destino {f, c}.
     * @returns {{f: number, c: number}|null} Coordenadas de la ficha comida, o null si el movimiento no es válido.
     */
    ejecutarMovimiento(origen, destino) { 
        if (!this.esMovimientoValido(origen, destino)) 
            return null; 
            
        const middleF = origen.f + (destino.f - origen.f) / 2; 
        const middleC = origen.c + (destino.c - origen.c) / 2; 
        
        // Actualiza los estados de la matriz
        this.matriz[origen.f][origen.c] = 0; // El origen queda vacío
        this.matriz[middleF][middleC] = 0; // La ficha comida desaparece
        this.matriz[destino.f][destino.c] = 1; // El destino ahora tiene la ficha
        
        console.log(`[MODELO] Movimiento ejecutado: de (${origen.f},${origen.c}) a (${destino.f},${destino.c}). Ficha comida en (${middleF},${middleC})`);
        
        return { 
            f: middleF, 
            c: middleC 
        }; 
    }

    /**
     * Obtiene una lista con todos los movimientos de salto posibles para una ficha ubicada en (f, c).
     * 
     * @param {number} f - Fila de la ficha.
     * @param {number} c - Columna de la ficha.
     * @returns {Array<{f: number, c: number}>} Lista de destinos posibles.
     */
    obtenerMovimientosPosibles(f, c) { 
        const movimientos = []; 
        const direcciones = [ 
            { df: -2, dc: 0 }, // Arriba 
            { df: 2, dc: 0 },  // Abajo 
            { df: 0, dc: -2 }, // Izquierda 
            { df: 0, dc: 2 }   // Derecha 
        ];
        
        direcciones.forEach(dir => { 
            const destino = { 
                f: f + dir.df, 
                c: c + dir.dc 
            };
            if (this.esMovimientoValido({ f, c }, destino)) { 
                movimientos.push(destino); 
            } 
        }); 
        
        return movimientos; 
    } 

    /**
     * Cuenta cuántas fichas activas (valor 1) quedan en todo el tablero.
     * 
     * @returns {number} Cantidad de fichas restantes.
     */
    contarFichasRestantes() {
        let contador = 0;
        for (let r = 0; r < 7; r++) {
            for (let c = 0; c < 7; c++) {
                if (this.matriz[r][c] === 1)
                    contador++;
            }
        }
        return contador;
    }

    /**
     * Evalúa si la partida ha terminado (ya sea porque queda una sola ficha o 
     * porque no existen movimientos posibles restantes para ninguna ficha).
     * 
     * @returns {boolean} True si el juego terminó, false en caso contrario.
     */
    esJuegoTerminado() {
        if (this.contarFichasRestantes() === 1)
            return true;
            
        for (let r = 0; r < 7; r++) {
            for (let c = 0; c < 7; c++) {
                if (this.matriz[r][c] === 1) {
                    if (this.obtenerMovimientosPosibles(r, c).length > 0) {
                        return false; // Todavía quedan movimientos
                    }
                }
            }
        }
        
        return true; // No hay más movimientos posibles
    }
}