document.addEventListener('DOMContentLoaded', function() {
    const loaderScreen = document.getElementById('loader-screen');
    const progressText = document.getElementById('loading-progress');

    const totalTime = 5000; // 5 segundos exactos
    const intervalTime = 50; // Cada cuánto se actualiza el número (ms)
    let currentProgress = 0;

    const increment = 100 / (totalTime / intervalTime);

    const loadingTimer = setInterval(() => {
        currentProgress += increment;

        if (currentProgress >= 100) {
            currentProgress = 100;
            clearInterval(loadingTimer);

            // Ocultar pantalla de carga con desvanecimiento suave
            loaderScreen.classList.add('hidden');
        }

        // Mostrar el porcentaje redondeado
        progressText.textContent = Math.round(currentProgress) + '%';
    }, intervalTime);
});