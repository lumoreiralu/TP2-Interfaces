document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Evita que recargue la página de golpe

    const btnText = document.querySelector('.btn-text');
    const spinner = document.querySelector('.spinner');
    const submitBtn = document.getElementById('submitBtn');
    const formElement = document.getElementById('registerForm');
    const successMessage = document.getElementById('successMessage');

    // 1. Validar opcionalmente si las contraseñas coinciden 
    const passwords = formElement.querySelectorAll('input[type="password"]');
    if (passwords.length >= 2 && passwords[0].value !== passwords[1].value) {
        alert('Las contraseñas no coinciden. Por favor, revísalas.');
        return;
    }

    // 2. Desactivar botón y activar spinner de carga
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';

    // 3. Simular tiempo de respuesta (1.5 segundos)
    setTimeout(() => {
        // Ocultar formulario y mostrar cartel de éxito con animación
        formElement.style.display = 'none';
        successMessage.style.display = 'flex';

        // 4. Redirigir al Home después de 1.5 segundos más
        setTimeout(() => {
            window.location.href = '../login/login.html'; 
        }, 1500);

    }, 1500);
});