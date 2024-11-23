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

function loadUsers() {
    return fetch('/get_usuarios', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateUserTable(data.users);
        } else {
            console.error('Error al obtener usuarios:', data.error);
        }
    })
    .catch(error => {
        console.error('Error en la solicitud:', error);
    });
}

function updateUserTable(users) {
    const tableBody = document.querySelector('#usersView tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    users.forEach(user => {
        let estadoColor = user.estado === 'activo' ? 'text-green-700' : 'text-red-700';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${user.username}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${user.tipo}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium ${estadoColor}">${user.estado}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button 
                    onclick="editarUsuario('${user.user_id}', '${user.username}', '${user.tipo}', '${user.estado}')" 
                    class="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors duration-200 mr-2">
                    Editar
                </button>
                <button 
                    onclick="eliminarUsuario('${user.user_id}', '${user.username}')" 
                    class="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors duration-200">
                    Eliminar
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function agregarUsuario() {
    const getFormData = () => {
        const username = Swal.getPopup().querySelector('#username').value.trim();
        const tipo = Swal.getPopup().querySelector('#tipo').value;
        const password = Swal.getPopup().querySelector('#password').value.trim();
        const estado = Swal.getPopup().querySelector('#estado').value;
        return { username, tipo, password, estado };
    };

    const showAgregarModal = (errorMessage = '') => {
        Swal.fire({
            title: 'Agregar Usuario',
            html: `
                <div class="space-y-4 p-2">
                    ${errorMessage ? `<div class="text-red-600 text-sm">${errorMessage}</div>` : ''}
                    <div class="relative">
                        <input id="username"
                            maxlength="20" 
                            class="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:border-transparent transition-all text-sm placeholder:text-gray-400" 
                            placeholder="Nombre de usuario">
                    </div>
                    <div class="relative">
                        <select id="tipo" 
                            class="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:border-transparent transition-all text-sm appearance-none">
                            <option value="" disabled selected class="text-gray-400">Selecciona el tipo</option>
                            <option value="admin" class="text-gray-700">Admin</option>
                            <option value="usuario" class="text-gray-700">Usuario</option>
                        </select>
                    </div>
                    <div class="relative">
                        <input id="password" 
                            type="password" 
                            class="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:border-transparent transition-all text-sm placeholder:text-gray-400" 
                            placeholder="Contraseña">
                    </div>
                    <div class="relative">
                        <select id="estado" 
                            class="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:border-transparent transition-all text-sm appearance-none">
                            <option value="" disabled selected class="text-gray-400">Selecciona el estado</option>
                            <option value="activo" class="text-gray-700">Activo</option>
                            <option value="desactivado" class="text-gray-700">Desactivado</option>
                        </select>
                    </div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Agregar',
            cancelButtonText: 'Cancelar',
            customClass: {
                popup: 'rounded-xl shadow-xl border border-gray-100',
                title: 'text-xl font-semibold text-gray-800 pb-2',
                htmlContainer: 'px-2',
                confirmButton: 'py-2 px-6 text-sm',
                cancelButton: 'py-2 px-6 text-sm'
            },
            buttonsStyling: true,
            preConfirm: () => {
                const { username, tipo, password, estado } = getFormData();

                if (!username || !tipo || !password || !estado) {
                    Swal.showValidationMessage(`Todos los campos son obligatorios`);
                    return false;
                }

                return { username, tipo, password, estado };
            }
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                fetch('/agregar_usuario', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(result.value)
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showAlert('El usuario fue agregado exitosamente', 'success');
                        loadUsers();
                    } else {
                        showAgregarModal(data.error || 'Hubo un error al agregar el usuario');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showAlert(error.message || 'Hubo un problema al conectar con el servidor', 'error');
                });
            }
        });
    };
    
    showAgregarModal();
}

function editarUsuario(userId, currentUsername, currentTipo, currentEstado) {
    const showEditModal = (errorMessage = '') => {
        Swal.fire({
            title: 'Editar Usuario',
            html: `
                <div class="space-y-4 p-2">
                    ${errorMessage ? `<div class="text-red-600 text-sm">${errorMessage}</div>` : ''}
                    <div class="relative">
                        <input id="username"
                            maxlength="20"
                            class="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:border-transparent transition-all text-sm placeholder:text-gray-400" 
                            placeholder="Nombre de usuario"
                            value="${currentUsername}">
                    </div>
                    <div class="relative">
                        <select id="tipo" 
                            class="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:border-transparent transition-all text-sm appearance-none">
                            <option value="admin" ${currentTipo === 'admin' ? 'selected' : ''} class="text-gray-700">Admin</option>
                            <option value="usuario" ${currentTipo === 'usuario' ? 'selected' : ''} class="text-gray-700">Usuario</option>
                        </select>
                    </div>
                    <div class="relative">
                        <input id="password" 
                            type="password" 
                            class="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:border-transparent transition-all text-sm placeholder:text-gray-400" 
                            placeholder="Nueva contraseña (dejar en blanco para mantener la actual)">
                    </div>
                    <div class="relative">
                        <select id="estado" 
                            class="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:border-transparent transition-all text-sm appearance-none">
                            <option value="activo" ${currentEstado === 'activo' ? 'selected' : ''} class="text-gray-700">Activo</option>
                            <option value="desactivado" ${currentEstado === 'desactivado' ? 'selected' : ''} class="text-gray-700">Desactivado</option>
                        </select>
                    </div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Guardar',
            cancelButtonText: 'Cancelar',
            customClass: {
                popup: 'rounded-xl shadow-xl border border-gray-100',
                title: 'text-xl font-semibold text-gray-800 pb-2',
                htmlContainer: 'px-2',
                confirmButton: 'py-2 px-6 text-sm',
                cancelButton: 'py-2 px-6 text-sm'
            },
            preConfirm: () => {
                const username = Swal.getPopup().querySelector('#username').value.trim();
                const tipo = Swal.getPopup().querySelector('#tipo').value;
                const password = Swal.getPopup().querySelector('#password').value.trim();
                const estado = Swal.getPopup().querySelector('#estado').value;

                if (!username || !tipo || !estado) {
                    Swal.showValidationMessage(`
                        <div class="flex items-center text-red-600">
                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            Username, tipo y estado son obligatorios
                        </div>
                    `);
                    return false;
                }

                const userData = { userId, username, tipo, estado };
                if (password) userData.password = password;
                return userData;
            }
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                fetch('/editar_usuario', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    },
                    body: JSON.stringify(result.value)
                })
                .then(async response => {
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Error en la respuesta del servidor');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        showAlert('Los cambios fueron guardados exitosamente', 'success');
                        loadUsers();
                    } else {
                        showAlert(data.error || 'Hubo un error al actualizar el usuario', 'error');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    if (error.message === 'El nombre de usuario ya está en uso') {
                        showEditModal('El nombre de usuario ya está registrado. Por favor, elige otro.');
                    } else {
                        showAlert('Hubo un problema al conectar con el servidor', 'error');
                    }
                });
            }
        });
    };

    showEditModal();
}

function eliminarUsuario(userId, username) {
    Swal.fire({
        text: `¿Deseas eliminar al usuario ${username}?`,
        icon: 'warning',
        toast: true,
        position: 'top-right',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch('/eliminar_usuario', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                },
                body: JSON.stringify({ userId })
            })
            .then(response => {
                if (!response.ok) throw new Error('Error en la respuesta del servidor');
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    showAlert('El usuario ha sido eliminado correctamente', 'success');
                    loadUsers();
                } else {
                    showAlert(data.error || 'No se pudo eliminar el usuario', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('Hubo un problema al conectar con el servidor', 'error');
            });
        }
    });
}

function initializeSettingsHandlers() {
    const usersConfigButton = document.getElementById('usersConfigButton');
    const usersView = document.getElementById('usersView');
    const configView = document.getElementById('configView');
    const backButton = document.getElementById('backButton');
    
    if (usersConfigButton) {
        usersConfigButton.addEventListener('click', () => {
            configView.classList.add('hidden');
            usersView.classList.remove('hidden');
            saveViewState('users');
            loadUsers();
        });
    }

    if (backButton) {
        backButton.addEventListener('click', () => {
            usersView.classList.add('hidden');
            configView.classList.remove('hidden');
            saveViewState('config');
        });
    }

    const agregarUsuarioBtn = document.getElementById('agregarUsuarioBtn');
    if (agregarUsuarioBtn) {
        agregarUsuarioBtn.addEventListener('click', agregarUsuario);
    }

    loadViewState();
}

function saveViewState(view) {
    localStorage.setItem('currentSettingsView', view);
}

function loadViewState() {
    const currentView = localStorage.getItem('currentSettingsView');
    const configView = document.getElementById('configView');
    const usersView = document.getElementById('usersView');
    
    if (currentView === 'users') {
        configView.classList.add('hidden');
        usersView.classList.remove('hidden');
        loadUsers();
    } else {
        usersView.classList.add('hidden');
        configView.classList.remove('hidden');
    }
}

function selecionarTema() {
    const temasSoporte = [
        { id: 'hardware', text: 'Soporte de Hardware', checked: true },
        { id: 'software', text: 'Soporte de Software', checked: true },
        { id: 'redes', text: 'Soporte de Redes', checked: true },
        { id: 'otros', text: 'Otros', checked: true }
    ];

    const checksHTML = temasSoporte.map(tema => `
        <div class="flex items-center mb-4 last:mb-0">
            <input 
                type="checkbox" 
                id="${tema.id}" 
                ${tema.checked ? 'checked' : ''} 
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
            >
            <label 
                for="${tema.id}" 
                class="ml-2 text-sm font-medium text-gray-900 select-none cursor-pointer"
            >${tema.text}</label>
        </div>
    `).join('');

    Swal.fire({
        title: 'Seleccionar Temas de Soporte',
        html: `
            <div class="flex flex-col text-left">
                ${checksHTML}
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        customClass: {
            popup: 'rounded-lg shadow-xl',
            title: 'text-xl font-bold text-gray-900 mb-4',
            htmlContainer: 'py-4',
            actions: 'gap-2'
        },
        preConfirm: () => {
            return temasSoporte.map(tema => ({
                id: tema.id,
                text: tema.text,
                checked: document.getElementById(tema.id).checked
            }));
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const temasSeleccionados = result.value;
            fetch('/actualizar_temas_soporte', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                },
                body: JSON.stringify({ temas: temasSeleccionados })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showAlert('Los temas de soporte han sido actualizados', 'success');
                    
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('No se pudieron actualizar los temas de soporte', 'error');
            });
        }
    });
}

function selecionarTema() {
    fetch('/obtener_temas_soporte', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
    })
    .then(response => response.json())
    .then(data => {
        const temasSoporte = [
            { id: 'hardware', text: 'Soporte de Hardware' },
            { id: 'software', text: 'Soporte de Software' },
            { id: 'redes', text: 'Soporte de Redes' },
            { id: 'otros', text: 'Otros' }
        ];

        temasSoporte.forEach(tema => {
            const temaSeleccionado = data.temas.some(t => t.id === tema.id && t.checked);
            tema.checked = temaSeleccionado;
        });

        const checksHTML = temasSoporte.map(tema => `
            <div class="flex items-center mb-4 last:mb-0">
                <input 
                    type="checkbox" 
                    id="${tema.id}" 
                    ${tema.checked ? 'checked' : ''} 
                    class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                >
                <label 
                    for="${tema.id}" 
                    class="ml-2 text-sm font-medium text-gray-900 select-none cursor-pointer"
                >${tema.text}</label>
            </div>
        `).join('');

        Swal.fire({
            title: 'Seleccionar Temas de Soporte',
            html: `<div class="flex flex-col text-left">${checksHTML}</div>`,
            showCancelButton: true,
            confirmButtonText: 'Guardar',
            cancelButtonText: 'Cancelar',
            customClass: {
                popup: 'rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 bg-white w-96',
                title: 'text-lg font-semibold text-gray-800',
                htmlContainer: 'py-4',
                actions: 'gap-2',
                confirmButton: 'py-2 px-6 text-sm',
                cancelButton: 'py-2 px-6 text-sm'
            },
            showCancelButton: true,
            preConfirm: () => {
                return temasSoporte.map(tema => ({
                    id: tema.id,
                    text: tema.text,
                    checked: document.getElementById(tema.id).checked
                }));
            }
        }).then((result) => {
            if (result.isConfirmed) {

                const temasSeleccionados = result.value;

                fetch('/actualizar_temas_soporte', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    },
                    body: JSON.stringify({ temas: temasSeleccionados })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                       showAlert('Los temas de soporte han sido actualizados', 'success');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showAlert('No se pudieron actualizar los temas de soporte', 'error');
                });
            }
        });
    })
    .catch(error => {
        console.error('Error al obtener temas:', error);
    });
}