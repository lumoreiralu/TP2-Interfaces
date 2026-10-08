"use strict";

// Buscamos en la página el elemento <canvas> usando su id
    var canvas = document.getElementById("canvas");

    // El canvas por sí solo NO dibuja. Para dibujar le pedimos su "contexto":
    // un objeto (ctx) con todas las herramientas de dibujo (colores, rectángulos,
    // líneas, imágenes, acceso a los píxeles, etc.).
    // "2d" indica que vamos a dibujar en 2D (existe también "webgl" para 3D).
    // A partir de acá, todo lo que dibujemos se hace con ctx.algo(...)
    var ctx = canvas.getContext("2d");

	// SISTEMA DE COORDENADAS DEL CANVAS
	//
	//   (0,0) ──────────────► x  (hasta 900)
	//     │
	//     │
	//     ▼
	//     y  (hasta 600)
	//
	// El origen (0,0) está ARRIBA a la IZQUIERDA.
	// x crece hacia la derecha e y crece hacia ABAJO (al revés que en matemática).

	// EJEMPLO DE DIBUJO: un rectángulo
	// - fillStyle elige el color de relleno ("#000", "red", "rgb(255,0,0)", ...).
	//   Es un "estado": queda seleccionado hasta que lo cambiemos.
	// - fillRect(x, y, ancho, alto) dibuja un rectángulo relleno con ese color.
	// Probá descomentar estas dos líneas: debería pintarse todo el canvas de negro.
	 ctx.fillStyle = "#000";
     ctx.fillRect (0, 0, 900, 600);
    
	// CARGA DE UNA IMAGEN EN EL CANVAS

	// Acá vamos a guardar el tamaño de la imagen (lo sabemos recién cuando termina de cargar)
	var imageHeight = 0;
    var imageWidth  = 0;

	// Acá vamos a guardar los píxeles leídos del canvas
	var imageData;

	// Creamos un objeto imagen desde JavaScript (equivale a un <img> que no se muestra en la página).
	// Al asignarle src, el navegador empieza a descargar el archivo.
	var ImagenHTML5 = new Image();
    ImagenHTML5.src = "landscape.jpg";

	// IMPORTANTE: la descarga NO es instantánea. Si intentáramos dibujar la imagen
	// en la línea siguiente al src, todavía no estaría lista y no se vería nada.
	// Por eso usamos onload: una función que el navegador ejecuta automáticamente
	// cuando la imagen terminó de descargarse. Todo lo que dependa de la imagen va adentro.
	ImagenHTML5.onload = function()
	{
		// drawImage(imagen, x, y) dibuja la imagen en el canvas con su esquina
		// superior izquierda en (x, y). Acá "this" es la imagen que se acaba de cargar.
		// Si la comentás, no se ve la imagen y getImageData (más abajo) lee un canvas vacío.
        ctx.drawImage(this, 0, 0);

		// Ya cargada, podemos conocer su tamaño en píxeles
		imageWidth  = this.width;
		imageHeight = this.height;

		// getImageData(x, y, ancho, alto) LEE los píxeles que hay en ese rectángulo
		// del canvas (no de la imagen). Por eso primero hay que dibujar la imagen con
		// drawImage: si no, leemos un canvas vacío (todos los píxeles transparentes).
		// El resultado es un objeto con width, height y data (los valores de cada
		// píxel); cómo se recorre ese data lo vemos más abajo.
		//
		// !!!! POSIBLE ERROR: si los filtros "no hacen nada", abrí la consola (F12 → Console).
		// Si aparece:
		//   "Failed to execute 'getImageData' ... The canvas has been tainted by cross-origin data."
		// es porque abriste el archivo con doble clic (la dirección empieza con file:///).
		// Por seguridad, el navegador no deja LEER los píxeles de una imagen cargada así:
		// drawImage funciona (la imagen se ve), pero getImageData falla y corta esta función.
		//
		// Solución: abrir la página desde un servidor local (la dirección empieza con http://).
		//   Opción 1 - VS Code: instalar la extensión "Live Server", clic derecho sobre
		//              este archivo → "Open with Live Server".
		//   Opción 2 - Python: en una terminal, parados en la carpeta de este archivo:
		//                  python3 -m http.server
		//              y abrir en el navegador http://localhost:8000/cargar-imagen.html
		imageData = ctx.getImageData(0, 0, imageWidth, imageHeight);

		// imageData es una COPIA de los píxeles: queda guardada en memoria aunque
		// borremos el canvas. clearRect(x, y, ancho, alto) borra ese rectángulo
		// (lo deja transparente). Así el canvas queda limpio y lo que se vea
		// después es solo lo que pinten nuestras funciones píxel por píxel.
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// elegir que dibujar (descomentar una sola a la vez)
		// pintarOriginal(imageData);
		filtroGrises(imageData);
    }

	// CÓMO SE GUARDAN LOS PÍXELES EN imageData.data
	//
	// Cada píxel tiene 4 valores, cada uno entre 0 y 255:
	//   R (rojo), G (verde), B (azul) y A (alfa = opacidad; 0 transparente, 255 opaco)
	//
	// data NO es una matriz: es UNA SOLA lista larga con todos los valores seguidos,
	// fila por fila, de izquierda a derecha y de arriba hacia abajo:
	//
	//   data = [ R,G,B,A,  R,G,B,A,  R,G,B,A,  ... ]
	//            píxel 0   píxel 1   píxel 2
	//
	// Para encontrar el píxel (x, y):
	//   - y * width  -> cuántos píxeles hay en las filas completas de arriba
	//   - + x        -> cuántos más avanzamos dentro de su fila
	//   - * 4        -> porque cada píxel ocupa 4 posiciones en data
	//
	//   index = (x + y * width) * 4
	//
	//   data[index+0] = R   data[index+1] = G   data[index+2] = B   data[index+3] = A
	//
	// Ejemplo con width = 900: el píxel (2, 1) está en index = (2 + 1*900) * 4 = 3608

	// FILTRO "IDENTIDAD": recorre los píxeles y los copia tal cual a una imagen nueva.
	// Sirve como plantilla: todos los filtros tienen esta misma estructura.
	function pintarOriginal(imageData)
	{
		// createImageData crea un imageData nuevo, vacío (todo transparente),
		// del mismo tamaño. Escribimos el resultado acá para no pisar la imagen original.
		var salida = ctx.createImageData(imageData.width, imageData.height);

		// Doble for: recorre TODOS los píxeles, columna x por columna, y fila y por fila
		for (var x = 0; x < imageData.width; x++) {
        	for (var y = 0; y < imageData.height; y++) {
				// leemos el color del píxel (x, y) de la imagen original...
				var r = getRed(imageData, x, y);
				var g = getGreen(imageData, x, y);
				var b = getBlue(imageData, x, y);
				// ...y lo escribimos igual en la salida (alfa 255 = totalmente opaco)
				setPixel(salida, x, y, r, g, b, 255);
			}
		}

		// putImageData(imageData, x, y) es lo opuesto a getImageData:
		// ESCRIBE los píxeles en el canvas, con la esquina superior izquierda en (x, y).
		// Hasta esta línea, los cambios no se ven en pantalla.
		ctx.putImageData(salida, 0, 0);
	}

	// FILTRO ESCALA DE GRISES: misma estructura que pintarOriginal,
	// solo cambia el color que escribimos en cada píxel.
	function filtroGrises(imageData)
	{
		var salida = ctx.createImageData(imageData.width, imageData.height);

		for (var x = 0; x < imageData.width; x++) {
        	for (var y = 0; y < imageData.height; y++) {
				var r = getRed(imageData, x, y);
				var g = getGreen(imageData, x, y);
				var b = getBlue(imageData, x, y);
				// Un gris es un color con R = G = B. Usamos el promedio de los tres
				// canales para conservar qué tan claro u oscuro era el píxel.
				// (Si da con decimales, data lo redondea solo al guardarlo.)
				var gris = (r + g + b) / 3;
				setPixel(salida, x, y, gris, gris, gris, 255);
			}
		}

		ctx.putImageData(salida, 0, 0);
	}

	// FUNCIONES AUXILIARES: esconden la cuenta del index para que los filtros
	// se lean fácil (pensamos en "el rojo del píxel (x, y)" y no en posiciones de data).

	// Escribe el color (r, g, b, a) en el píxel (x, y)
	function setPixel(imageData, x, y, r, g, b, a)
	{
		index = (x + y * imageData.width) * 4;
		imageData.data[index+0] = r;
		imageData.data[index+1] = g;
		imageData.data[index+2] = b;
		imageData.data[index+3] = a;
    }
	
	// Devuelven el valor de un canal (0 a 255) del píxel (x, y)
	function getRed(imageData, x, y)
	{
		index = (x + y * imageData.width) * 4;
		return imageData.data[index+0];		
    }	
	
	function getGreen(imageData, x, y) 
	{
		index = (x + y * imageData.width) * 4;
		return imageData.data[index+1];		
    }	
	
	function getBlue(imageData, x, y) 
	{
		index = (x + y * imageData.width) * 4;
		return imageData.data[index+2];		
    }	