const API_URL = 'https://vj.interfaces.jima.com.ar/api/v2';

async function cargarJuegosDelSitio() {
    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error('Error al conectar con la API de la cátedra');
        }

        const juegos = await response.json();
        
        if (juegos && juegos.length > 0) {
            // Llenamos cada carrusel apuntando a su clase específica y cortando trozos distintos del array
            llenarCarruselPorClase('.track-recomendados', juegos.slice(0, 25));
            llenarCarruselPorClase('.track-mas-jugados', juegos.slice(25, 50));
            llenarCarruselPorClase('.track-lanzamientos', juegos.slice(50, 65));
        }

    } catch (error) {
        console.error('Hubo un problema al cargar los juegos:', error);
    }
}

// Función que busca por clase y dibuja las tarjetas dinámicamente
function llenarCarruselPorClase(selectorClase, listaJuegos) {
    const track = document.querySelector(selectorClase);
    if (!track) return;

    // Vaciamos el contenido estático anterior
    track.innerHTML = '';

    listaJuegos.forEach(juego => {
        const tarjeta = document.createElement('div');
        tarjeta.classList.add('juego-tarjeta');

        tarjeta.innerHTML = `
            <img src="${juego.background_image_low_res}" alt="${juego.name}">
            <div class="info-juego">
                <span class="nombre-juego">${juego.name}</span>
            </div>
        `;


        track.appendChild(tarjeta);
    });
}

// Ejecutar cuando cargue la página
document.addEventListener('DOMContentLoaded', cargarJuegosDelSitio);