// Maneja la animación de carga y éxito en formularios de login y registro
document.addEventListener('DOMContentLoaded', function() {
    
    // Capturamos ambos formularios (uno existira y el otro sera nu
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // ==========================================
    // LÓGICA PARA EL LOGIN
    // ==========================================
    if (loginForm) {
        // Login: al enviar, no recarga la pagina (preventDefault) y ar
        loginForm.addEventListener('submit', function(e) {
            /* Corta el comportamiento por defecto del form (que seria
               recargar la pagina). Sin esto, la pagina se recarga en el
               instante y no se ve ni el spinner ni el mensaje. */
            e.preventDefault();
            /* Ejecutamos la animacion y redirigimos al Home. Todo el trabajo
               esta en ejecutarAnimacion (abajo). */
            ejecutarAnimacion(loginForm, '../index.html');
        });
    }

    // ==========================================
    // LÓGICA PARA EL REGISTRO
    // ==========================================
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // 1. Validacion de contrasenas (exclusiva del registro).
            const passwords = registerForm.querySelectorAll('input[type="password"]');
            if (passwords.length >= 2 && passwords[0].value !== passwords[1].value) {
                alert('Las contraseñas no coinciden. Por favor, revísalas.');
                return; // Corta la ejecucion si no coinciden
            }

            /* 2. Si todo esta bien, animamos y redirigimos al login (no al
               home: el recien registrado todavia no entro). */
            ejecutarAnimacion(registerForm, '../login/login.html');
        });
    }

    // ==========================================
    // FUNCIÓN COMPARTIDA (Animación y Redirección)
    // ==========================================
    // MOTOR COMPARTIDO por login y registro. Hace 3 pasos en el ti
    function ejecutarAnimacion(formElement, urlDestino) {
        const btnText = document.querySelector('.btn-text');
        const spinner = document.querySelector('.spinner');
        const submitBtn = document.getElementById('submitBtn');
        const successMessage = document.getElementById('successMessage');

        // 1. Desactivar boton y activar spinner de carga.
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        spinner.style.display = 'inline-block';

        // 2. Simula el tiempo de respuesta del servidor (1.5 segundos)
        setTimeout(() => {
            formElement.style.display = 'none';
            successMessage.style.display = 'flex';

            // 3. Redirigir pasado un rato.
            setTimeout(() => {
                window.location.href = urlDestino; 
            }, 1500);

        }, 1500);
    }
});