document.addEventListener('DOMContentLoaded', function() {
    
    // Capturamos ambos formularios (uno existirá y el otro será null dependiendo de la página)
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // ==========================================
    // LÓGICA PARA EL LOGIN
    // ==========================================
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Ejecutamos la animación y redirigimos al Home
            ejecutarAnimacion(loginForm, '../index.html');
        });
    }

    // ==========================================
    // LÓGICA PARA EL REGISTRO
    // ==========================================
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // 1. Validación de contraseñas (exclusiva del registro)
            const passwords = registerForm.querySelectorAll('input[type="password"]');
            if (passwords.length >= 2 && passwords[0].value !== passwords[1].value) {
                alert('Las contraseñas no coinciden. Por favor, revísalas.');
                return; // Corta la ejecución si no coinciden
            }

            // 2. Si todo está bien, ejecutamos la animación y redirigimos al Login
            ejecutarAnimacion(registerForm, '../login/login.html');
        });
    }

    // ==========================================
    // FUNCIÓN COMPARTIDA (Animación y Redirección)
    // ==========================================
    function ejecutarAnimacion(formElement, urlDestino) {
        const btnText = document.querySelector('.btn-text');
        const spinner = document.querySelector('.spinner');
        const submitBtn = document.getElementById('submitBtn');
        const successMessage = document.getElementById('successMessage');

        // 1. Desactivar botón y activar spinner de carga
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        spinner.style.display = 'inline-block';

        // 2. Simular tiempo de respuesta (1.5 segundos)
        setTimeout(() => {
            // Ocultar formulario y mostrar cartel de éxito con animación
            formElement.style.display = 'none';
            successMessage.style.display = 'flex';

            // 3. Redirigir a la URL correspondiente después de 1.5 segundos más
            setTimeout(() => {
                window.location.href = urlDestino; 
            }, 1500);

        }, 1500);
    }
});