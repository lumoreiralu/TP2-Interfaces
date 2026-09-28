document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = document.getElementById('sendCommentBtn');
    const commentInput = document.getElementById('commentInput');
    const commentsContainer = document.getElementById('commentsContainer');

    function createComment() {
        const text = commentInput.value.trim();
        
        // Si está vacío, no hace nada
        if (text === '') return;

        // Crear el contenedor del nuevo comentario
        const commentItem = document.createElement('div');
        commentItem.classList.add('comment-item');

        // Estructura interna del comentario (usando tus clases existentes)
        commentItem.innerHTML = `
            <div class="comment-user">
              <svg class="icon-user" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              <span>Tú</span>
            </div>
            <div class="comment-text" style="margin-bottom: 15px;">
              ${text}
            </div>
        `;

        // Agregar el comentario al contenedor principal
        commentsContainer.appendChild(commentItem);

        // Limpiar el input después de enviar
        commentInput.value = '';
    }

    // Evento al hacer clic en el botón de enviar
    sendBtn.addEventListener('click', createComment);

    // Evento opcional para enviar presionando la tecla "Enter"
    commentInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            createComment();
        }
    });
});