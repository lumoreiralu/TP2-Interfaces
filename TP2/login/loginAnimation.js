document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Evita que la página recargue de golpe

    const btnText = document.querySelector('.btn-text');
    const spinner = document.querySelector('.spinner');
    const submitBtn = document.getElementById('submitBtn');
    const formElement = document.getElementById('loginForm');
    const successMessage = document.getElementById('successMessage');

    // 1. Desactivar botón y mostrar animación de carga en el botón
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';

    // 2. Simular espera de red (por ejemplo, 1.5 segundos)
    setTimeout(() => {
        // Ocultar formulario y mostrar cartel de éxito animado
        formElement.style.display = 'none';
        successMessage.style.display = 'flex';

        // 3. Redirigir al Home después de otro segundo y medio
        setTimeout(() => {
            window.location.href = '../index.html'; 
        }, 1500);

    }, 1500);
});