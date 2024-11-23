function showAlert(message, type = 'info') {
    Swal.fire({
        icon: type,
        title: message,
        toast: true,
        position: 'top-right',
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true
    })
}

function appendMessage(tipo, mensaje) {
    const messageDiv = document.createElement('div');
    
    if (tipo === 'usuario') {
        messageDiv.className = 'bg-blue-100 rounded-lg p-4 w-auto max-w-fit ml-auto';
        messageDiv.innerHTML = createUserMessageHTML(mensaje);
    } else {
        messageDiv.className = 'bg-gray-100 rounded-lg p-4 max-w-[80%]';
        messageDiv.innerHTML = createAssistantMessageHTML(mensaje);
    }
    
    document.getElementById('messages').appendChild(messageDiv);
    scrollToBottom();
}

function createUserMessageHTML(mensaje) {
    return `
        <div class="flex items-start justify-end">
            <div>
                <p class="text-sm font-semibold text-blue-800 mb-1">Usuario</p>
                <p class="text-gray-800">${escapeHtml(mensaje)}</p>
            </div>
        </div>
    `;
}

function createAssistantMessageHTML(mensaje) {
    return `
        <div class="flex items-start">
            <div>
                <p class="text-sm font-semibold text-gray-800 mb-1">Asistente</p>
                <p class="text-gray-800">${mensaje}</p>
            </div>
        </div>
    `;
}

function scrollToBottom() {
    const messagesContainer = document.getElementById('messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function loadChatHistory() {
    fetch('/get_chat_history')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.history) {
                document.getElementById('messages').innerHTML = '';
                data.history.forEach(chat => {
                    appendMessage('usuario', chat.question);
                    appendMessage('assistant', chat.answer);
                });
                scrollToBottom();
            }
        })
        .catch(() => {
            document.getElementById('messages').innerHTML = '';
        });
}

function initializeAssistantHandlers() {
    const chatForm = document.getElementById('chat-form');
    const clearButton = document.getElementById('clear-chat');
    
    loadChatHistory();
    
    if (chatForm) {
        chatForm.onsubmit = handleChatSubmission;
    }
    
    if (clearButton) {
        clearButton.onclick = function(e) {
            e.preventDefault();
            const messagesContainer = document.getElementById('messages');
            messagesContainer.innerHTML = '';
        };
    }
}

function handleChatSubmission(e) {
    e.preventDefault();
    const pregunta = document.getElementById('pregunta').value;
    if (!pregunta) return;
    
    appendMessage('usuario', pregunta);
    document.getElementById('pregunta').value = '';
    
    sendQuestion(pregunta);
}

function sendQuestion(pregunta, forceNew = false, existingFaqId = null) {
    if (!forceNew) {
        fetch('/check_question', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ pregunta: pregunta })
        })
        .then(response => response.json())
        .then(data => {
            if (data.exists) {
                Swal.fire({
                    text: '¿Quieres volver a generar esta pregunta?',
                    icon: 'question',
                    toast: true,
                    position: 'top-right',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, generar nueva respuesta',
                    cancelButtonText: 'No, usar respuesta existente'
                }).then((result) => {
                    if (result.isConfirmed) {

                        processSendQuestion(pregunta, true, data.faqId);
                    } else {

                        const messagesContainer = document.getElementById('messages');
                        
                        const userDiv = document.createElement('div');
                        userDiv.className = 'message user-message';
                        userDiv.textContent = pregunta;
                        messagesContainer.appendChild(userDiv);
                        
                        const assistantDiv = document.createElement('div');
                        assistantDiv.className = 'message assistant-message';
                        assistantDiv.innerHTML = data.existingAnswer;
                        messagesContainer.appendChild(assistantDiv);
                        
                        scrollToBottom();
                    }
                });
            } else {
                processSendQuestion(pregunta, false);
            }
        })
        .catch(handleError);
    } else {
        processSendQuestion(pregunta, true, existingFaqId);
    }
}

function processSendQuestion(pregunta, forceNew, existingFaqId = null) {
    const formData = new URLSearchParams();
    formData.append('pregunta', pregunta);
    formData.append('force_new', forceNew);
    if (existingFaqId) {
        formData.append('existing_faq_id', existingFaqId);
    }

    fetch('/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
    })
    .then(handleResponse)
    .then(data => {
        loadChatHistory();
    })
    .catch(handleError);
}

function handleResponse(response) {
    if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
    }
    return response.json();
}

function handleError(error) {
    console.error('Error:', error);
    appendMessage('assistant', 'Hubo un error al procesar tu solicitud. Inténtalo de nuevo.');
}


function clearChatHistory() {
    fetch('/clear_chat', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
            if (data.success) {
                const messagesContainer = document.getElementById('messages');
                messagesContainer.innerHTML = '';
                showAlert('¡Historial del chat limpiado con éxito!', 'success');
            } else {
                console.error('Error al limpiar el chat:', data.error);
                showAlert('Error al limpiar el historial del chat', 'error');
            }
        })
        .catch(error => {
            console.error('Error al limpiar el chat:', error);
            showAlert('Error al limpiar el historial del chat', 'error');
        });
}

function initializeAssistantHandlers() {
    const chatForm = document.getElementById('chat-form');
    const clearButton = document.getElementById('clear-chat');
    const messagesContainer = document.getElementById('messages');

    if (messagesContainer) {
        loadChatHistory();
    }
    
    if (chatForm) {
        chatForm.onsubmit = handleChatSubmission;
    }
    
    if (clearButton) {
        clearButton.onclick = function(e) {
            e.preventDefault();
            Swal.fire({
                text: '¿Deseas limpiar todo el historial del chat?',
                icon: 'warning',
                toast: true,
                position: 'top-right',
                showCancelButton: true,
                confirmButtonText: 'Sí, limpiar'
            }).then((result) => {
                if (result.isConfirmed) {
                    clearChatHistory();
                }
            });
        };
    }
}

document.addEventListener('DOMContentLoaded', initializeAssistantHandlers);