const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.6/marked.min.js';
document.head.appendChild(script);

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

function initializeFAQHandlers() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterQuestions);
    }
}

function filterQuestions() {
    const input = document.getElementById('searchInput');
    const filter = input.value.toLowerCase();
    const faqList = document.getElementById('faqList');
    const questions = faqList.getElementsByTagName('div');

    for (let question of questions) {
        const questionText = question.getElementsByTagName('h3')[0]?.textContent;
        if (questionText) {
            question.style.display = questionText.toLowerCase().includes(filter) ? "" : "none";
        }
    }
}

function closeAllAnswers() {
    const allAnswers = document.querySelectorAll('[id^="answer-"]');
    const allButtons = document.querySelectorAll('button[onclick^="toggleAnswer"]');
    
    allAnswers.forEach(answer => {
        answer.classList.remove('block');
        answer.classList.add('hidden');
        const faqId = answer.id.replace('answer-', '');
        const buttonContainer = document.getElementById(`buttonContainer-${faqId}`);
        if (buttonContainer) buttonContainer.remove();
    });
    
    allButtons.forEach(button => {
        button.textContent = 'Ver más';
    });
}

function toggleAnswer(faqId) {
    const answerContainer = document.getElementById('answer-' + faqId);
    const button = event.target;

    if (answerContainer) {
        if (answerContainer.classList.contains('hidden')) {

            closeAllAnswers();
            
            answerContainer.classList.remove('hidden');
            answerContainer.classList.add('block');
            button.textContent = 'Ver menos';

            if (!document.getElementById(`buttonContainer-${faqId}`)) {
                const buttonContainer = document.createElement('div');
                buttonContainer.id = `buttonContainer-${faqId}`;
                buttonContainer.classList.add('flex', 'justify-center', 'items-center', 'mt-4', 'gap-4');

                const generateBtn = document.createElement('button');
                generateBtn.id = `generateBtn-${faqId}`;
                generateBtn.textContent = 'Generar respuesta';
                generateBtn.classList.add('text-green-500', 'hover:text-green-700', 'transition-colors', 'duration-200', 'px-4', 'py-2', 'border', 'border-green-500', 'rounded');
                generateBtn.onclick = () => generateResponse(faqId);

                const addToResourcesBtn = document.createElement('button');
                addToResourcesBtn.id = `addToResourcesBtn-${faqId}`;
                addToResourcesBtn.textContent = 'Agregar a recursos';
                addToResourcesBtn.classList.add('text-purple-500', 'hover:text-purple-700', 'transition-colors', 'duration-200', 'px-4', 'py-2', 'border', 'border-purple-500', 'rounded');
                addToResourcesBtn.onclick = () => addToResources(faqId);

                buttonContainer.appendChild(generateBtn);
                buttonContainer.appendChild(addToResourcesBtn);

                answerContainer.appendChild(buttonContainer);
            }
        } else {
            answerContainer.classList.remove('block');
            answerContainer.classList.add('hidden');
            button.textContent = 'Ver más';
            
            const buttonContainer = document.getElementById(`buttonContainer-${faqId}`);
            if (buttonContainer) buttonContainer.remove();
        }
    }
}

function generateResponse(faqId) {
    Swal.fire({
        text: "¿Deseas generar una respuesta para esta pregunta?",
        icon: 'warning',
        toast: true,
        position: 'top-right',
        showCancelButton: true,
        confirmButtonText: 'Sí, generar'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/generate_answer_for_faq/${faqId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const answerContainer = document.getElementById('answer-' + faqId);
                    const answerParagraph = answerContainer.querySelector('p');
                    const htmlContent = marked.parse(data.respuesta);
                    answerParagraph.innerHTML = htmlContent;
                    showAlert('Respuesta generada correctamente', 'success');
                } else {
                    showAlert(data.respuesta || 'Error al generar la respuesta.', 'error');
                }
            })
            .catch(error => console.error('Error al generar respuesta:', error));
        }
    });
}

function addNewQuestion() {
    const question = document.getElementById('newQuestion').value.trim();

    if (question === "") {
        showAlert("Por favor, ingresa una pregunta.", 'warning');
        return;
    }

    fetch('/add_question', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const faqList = document.getElementById('faqList');
            const newQuestionDiv = document.createElement('div');
            newQuestionDiv.classList.add('border', 'rounded-lg', 'p-4');
            newQuestionDiv.id = `faq-${data.faq_id}`;

            newQuestionDiv.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex-grow">
                        <h3 class="font-semibold text-black" id="question-text-${data.faq_id}">${question}</h3>
                    </div>
                    <div class="flex items-center gap-4 ml-4">
                        <button 
                            class="w-16 text-blue-500 hover:text-blue-700 transition-colors duration-200"
                            onclick="toggleAnswer('${data.faq_id}')"
                        >
                            Ver más
                        </button>
                        <button 
                            class="w-16 text-yellow-500 hover:text-yellow-700 transition-colors duration-200"
                            onclick="editQuestion('${data.faq_id}')"
                        >
                            Editar
                        </button>
                        <button 
                            class="w-16 text-red-500 hover:text-red-700 transition-colors duration-200"
                            onclick="deleteQuestion('${data.faq_id}')"
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
                <div id="answer-${data.faq_id}" class="hidden mt-4 transition-all duration-300 ease-in-out">
                    <p>${marked.parse(data.answer || '')}</p>
                </div>
            `;
            
            faqList.appendChild(newQuestionDiv);
            document.getElementById('newQuestion').value = '';

            showAlert('Pregunta agregada exitosamente', 'success');
        } else if (data.error) {
            showAlert(data.error);
        } else {
            showAlert('Error al añadir la pregunta', 'error');
        }
    })
    .catch(error => console.error('Error:', error));
}

function deleteQuestion(faqId) {
    Swal.fire({
        text: "No podrás revertir esta acción.",
        icon: 'warning',
        toast: true,
        position: 'top-right',

        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/delete_faq/${faqId}`, {
                method: 'DELETE'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const questionElement = document.querySelector(`#faq-${faqId}`);
                    if (questionElement) {
                        questionElement.remove();
                    }
                    showAlert('Pregunta eliminada exitosamente', 'success');
                } else {
                    showAlert('Error al eliminar la pregunta.', 'error');
                }
            })
            .catch(error => console.error('Error:', error));
        }
    })
}

function addToResources(faqId) {
    Swal.fire({
        text: "¿Deseas agregar esta pregunta a los recursos?",
        icon: 'warning',
        toast: true,
        position: 'top-right',
        showCancelButton: true,
        confirmButtonText: 'Sí, agregar'
        
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/add_to_resources/${faqId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showAlert('Agregado a recursos exitosamente', 'success');
                } else {
                    showAlert(data.error || 'Error al agregar a recursos', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('Error al agregar a recursos', 'error');
            });
        }
    });
}

function closeEditModal(faqId) {
    document.getElementById(`editModal-${faqId}`).classList.add('hidden');
}

function editQuestion(faqId) {
    Swal.fire({
        title: 'Editar Pregunta', 
        input: 'text',
        inputValue: document.getElementById(`question-text-${faqId}`).innerText,

        customClass: {
            popup: 'rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 bg-white w-96', 
            title: 'text-lg font-semibold text-gray-800',
            input: 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 rounded-md text-sm',
            confirmButton: 'py-2 px-6 text-sm',
            cancelButton: 'py-2 px-6 text-sm'
        },
        
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        buttonsStyling: true,

        inputAttributes: {
            maxlength: 200
        },

        preConfirm: (newQuestion) => {
            if (!newQuestion) {
                Swal.showValidationMessage('La pregunta no puede estar vacía');
            } else {
                return newQuestion;
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const updatedQuestion = result.value;
            document.getElementById(`question-text-${faqId}`).innerText = updatedQuestion;

            fetch(`/update_faq_question/${faqId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question: updatedQuestion })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showAlert('Pregunta actualizada correctamente', 'success');
                } else {
                    showAlert('Error al actualizar la pregunta', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('Error al actualizar la pregunta');
            });
        }
    });
}

function saveEdit(faqId) {
    const newQuestion = document.getElementById(`editQuestionInput-${faqId}`).value.trim();
    
    if (newQuestion === "") {
        showAlert("La pregunta no puede estar vacía.", 'error');
        return;
    }

    document.getElementById(`question-text-${faqId}`).innerText = newQuestion;

    fetch(`/update_faq_question/${faqId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: newQuestion })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('Pregunta actualizada correctamente', 'success');
            closeEditModal(faqId);
        } else {
            showAlert('Error al actualizar la pregunta', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('Error al actualizar la pregunta');
    });
}

function limpiarListaFaq() {
    Swal.fire({
        text: "Esta acción eliminará todas las preguntas frecuentes.",
        icon: 'warning',
        toast: true,
        position: 'top-right',
        showCancelButton: true,
        confirmButtonText: 'Sí, limpiar',
        cancelButtonText: 'Cancelar',
    }).then((result) => {
        if (result.isConfirmed) {
            fetch('/clear_faq', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    const faqList = document.getElementById('faqList');
                    if (faqList) {
                        faqList.innerHTML = ''; 
                        showAlert('Todas las preguntas frecuentes han sido eliminadas correctamente.', 'success');
                    } else {
                        throw new Error('No se encontró el contenedor de FAQ');
                    }
                } else {
                    throw new Error(data.error || 'Error desconocido al eliminar las preguntas');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('Error al eliminar las preguntas frecuentes: ' + error.message, 'error');
            });
        } 
    });
}