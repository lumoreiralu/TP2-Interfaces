// Maneja la pantalla de carga y el contador de porcentaje
document.addEventListener('DOMContentLoaded', function() {
    const loaderScreen = document.getElementById('loader-screen');
    const progressText = document.getElementById('loading-progress');

    const totalTime = 5000;
    const intervalTime = 50;
    let currentProgress = 0;

    const increment = 100 / (totalTime / intervalTime);

    const loadingTimer = setInterval(() => {
        currentProgress += increment;

        if (currentProgress >= 100) {
            currentProgress = 100;
            clearInterval(loadingTimer);
            loaderScreen.classList.add('hidden');
        }

        progressText.textContent = Math.round(currentProgress) + '%';
    }, intervalTime);
});