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

function cargarVideosGuardadosHistorial() {
    fetch('/get_video_history', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarVideosGuardadosHistorial(data.videos);
        } else {
            console.error('Error al cargar videos:', data.error);
        }
    })
    .catch(error => {
        console.error('Error al cargar videos:', error);
    });
}

function cargarVideosGuardadosLista() {
    fetch('/get_video_list', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarVideosGuardadosLista(data.videos);
        } else {
            console.error('Error al cargar videos:', data.error);
        }
    })
    .catch(error => {
        console.error('Error al cargar videos:', error);
    });
}

function mostrarVideosGuardadosHistorial(videos) {
    const tutorialList = document.getElementById('tutorialList');
    tutorialList.innerHTML = '';

    if (!videos || videos.length === 0) {
        tutorialList.innerHTML = `
        <li class="text-center text-gray-500 py-4">
        No hay videos guardados. Realiza una búsqueda para encontrar tutoriales.
        </li>
        `;
        return;
    }

    videos.forEach(video => {
        const videoId = extraerIdDeYoutube(video.url);
        const videoItem = document.createElement('li');
        videoItem.className = "border-b py-2 flex items-center";
        videoItem.innerHTML = `
        <img src="https://img.youtube.com/vi/${videoId}/maxresdefault.jpg" 
        alt="Miniatura ${video.title}" 
        class="w-16 h-16 mr-4 rounded object-cover">
        <div class="flex-1">
        <h3 class="font-semibold">${video.title}</h3>
        <p class="text-gray-500">Duración: ${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')} minutos</p>
        <a href="javascript:void(0)" 
        onclick="abrirTutorial('${video.title}', '${video.url}')" 
        class="text-blue-500 hover:underline">
        Ver Video
        </a>
        <button onclick="guardarVideoLista({
            title: '${video.title.replace(/'/g, "\\'")}',
            url: '${video.url}',
            duration: ${video.duration}
        })" class="text-green-500 hover:underline ml-4">
        Guardar Video
        </button>
        </div>
        `;
        tutorialList.appendChild(videoItem);
    });
}

function mostrarVideosGuardadosLista(videos) {
    const videosLista = document.getElementById('videosLista');
        videosLista.innerHTML = '';
        
        if (!videos || videos.length === 0) {
            videosLista.innerHTML = `
            <li class="text-center text-gray-500 py-4">
            No hay videos guardados.
            </li>
            `;
            return;
        }
        
        videos.forEach(video => {
            const videoId = extraerIdDeYoutube(video.url);
            const videoItem = document.createElement('li');
            videoItem.className = "border-b py-2 flex items-center";
            videoItem.innerHTML = `
            <img src="https://img.youtube.com/vi/${videoId}/maxresdefault.jpg" 
            alt="Miniatura ${video.title}" 
            class="w-16 h-16 mr-4 rounded object-cover">
            <div class="flex-1">
                <h3 class="font-semibold">${video.title}</h3>
                <p class="text-gray-500">Duración: ${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')} minutos</p>
                <div class="flex items-center">
                    <a href="javascript:void(0)" 
                    onclick="abrirTutorial('${video.title}', '${video.url}')" 
                    class="text-blue-500 hover:underline mr-4">
                    Ver Video
                    </a>
                    <button class="text-red-500" onclick="eliminarVideo('${video.video_id}')">
                    Eliminar
                    </button>
                </div>
            </div>
            `;
            videosLista.appendChild(videoItem);
        });

    window.videosGuardados = videos;
}

function eliminarVideo(videoId) {
    Swal.fire({
        text: 'No podrás recuperar este video una vez eliminado.',
        icon: 'warning',
        showCancelButton: true,
        toast: true,
        position: 'top-right',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/delete_video/${videoId}`, {
                method: 'DELETE',
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showAlert('Video eliminado correctamente.', 'success');
                    obtenerVideosGuardados();
                } else {
                    showAlert('Error al eliminar el video.', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('Error al eliminar el video.', 'error');
            });
        }
    });
}

function obtenerVideosGuardados() {
    fetch('/get_video_list')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarVideosGuardadosLista(data.videos);
        } else {
            alert('Error al obtener la lista de videos.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al obtener la lista de videos.');
    });
}

function buscarVideos() {
    const tema = document.getElementById('searchInput').value;
    if (tema.length > 2) { 
        mostrarMensajeCarga(true);

        fetch('/buscar_videos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tema: tema })
        })
        .then(response => response.json())
        .then(videos => {
            mostrarMensajeCarga(false);
            mostrarResultados(videos);
        })
        .catch(error => {
            mostrarMensajeCarga(false);
            console.error('Error al buscar videos:', error);
        });
    }
}

function mostrarMensajeCarga(mostrar) {
    const loadingMessage = document.getElementById('loadingMessage');
    loadingMessage.classList.toggle('hidden', !mostrar);
}

function mostrarResultados(videos) {
    const tutorialList = document.getElementById('tutorialList');
    tutorialList.innerHTML = '';
    
    videos.forEach(video => {
        const videoId = extraerIdDeYoutube(video.url);
        const videoItem = document.createElement('li');
        videoItem.className = "border-b py-2 flex items-center";
        videoItem.innerHTML = `
        <img src="https://img.youtube.com/vi/${videoId}/maxresdefault.jpg" 
        alt="Miniatura ${video.titulo}" class="w-16 h-16 mr-4 rounded">
        <div class="flex-1">
        <h3 class="font-semibold">${video.titulo}</h3>
        <p class="text-gray-500">Duración: ${Math.floor(video.duracion / 60)}:${String(video.duracion % 60).padStart(2, '0')} minutos</p>
        <a href="javascript:void(0)" onclick="abrirTutorial('${video.titulo}', '${video.url}')" 
        class="text-blue-500 hover:underline">Ver Video</a>
        <button onclick="guardarVideoLista({
            title: '${video.titulo.replace(/'/g, "\\'")}',
            url: '${video.url}',
            duration: ${video.duracion}
        })" class="text-green-500 hover:underline ml-4">
        Guardar Video
        </button>
        </div>
        `;
        tutorialList.appendChild(videoItem);
        
        guardarVideoHistorial({
            title: video.titulo,
            url: video.url,
            duration: video.duracion
        });
    });
}

function abrirTutorial(titulo, url) {
    const embedUrl = url.replace("watch?v=", "embed/");

    Swal.fire({
        title: `<h2 class="text-lg font-semibold text-gray-800">${titulo}</h2>`,
        html: `<iframe class="w-full h-[400px]" src="${embedUrl}" frameborder="0" allowfullscreen></iframe>`,
        showCloseButton: true,
        showConfirmButton: false,
        width: '70%',
        heightAuto: false,
        customClass: {
            popup: 'bg-white rounded-lg shadow-lg',
            closeButton: 'text-gray-500 hover:text-gray-700'
        }
    });
}

function extraerIdDeYoutube(url) {
    const regExp = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[1].length === 11) ? match[1] : null;
}

async function guardarVideoHistorial(video) {
    try {
        const response = await fetch('/save_video_history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(video)
        });
        
        if (!response.ok) {
            throw new Error('Error al guardar el video');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

async function guardarVideoLista(video) {
    try {
        const response = await fetch('/save_video_list', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(video)
        });
        
        if (!response.ok) {
            showAlert("Este video ya está en tu lista de guardados", 'warning');
            throw new Error('Error al guardar el video');
        }
        showAlert("El video ha sido guardado en tu lista de videos.", 'success');

        obtenerVideosGuardados(); 

        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    cargarVideosGuardadosHistorial();
    cargarVideosGuardadosLista();
});

function cambiarVista(vistaId) {
    document.querySelectorAll('.vista').forEach(vista => {
        vista.classList.add('hidden');
    });

    document.getElementById(vistaId).classList.remove('hidden');

    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
        if (button.getAttribute('data-target') === vistaId) {
            button.classList.add('active');
        }
    });

    localStorage.setItem('vistaActual', vistaId);
}

function cargarUltimaVista() {
    const ultimaVista = localStorage.getItem('vistaActual');

    if (ultimaVista) {
        cambiarVista(ultimaVista);
    } else {
        cambiarVista('busquedaVideos');
    }
}

document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', (e) => {
        const vistaId = e.target.getAttribute('data-target');
        cambiarVista(vistaId);
    });
});

function filtrarVideos(videos, terminoBusqueda) {
    return videos.filter(video => 
        video.title.toLowerCase().includes(terminoBusqueda.toLowerCase())
        );
}

function inicializarBusquedaVideos() {
    const inputBusqueda = document.getElementById('buscarGuardado');
    let timeoutId;
    let videosOriginales = [];

    fetch('/get_video_list')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            videosOriginales = data.videos;
        }
    });

    inputBusqueda.addEventListener('input', (e) => {
        clearTimeout(timeoutId);

        timeoutId = setTimeout(() => {
            const terminoBusqueda = e.target.value.trim();

            if (terminoBusqueda === '') {
                mostrarVideosGuardadosLista(videosOriginales);
            } else {
                const videosFiltrados = filtrarVideos(videosOriginales, terminoBusqueda);
                mostrarVideosGuardadosLista(videosFiltrados);
            }
        }, 300);
    });
}

function limpiarHistorial() {
    Swal.fire({
        text: "Esta acción eliminará todo el historial de videos.",
        icon: 'warning',
        toast: true,
        position: 'top-right',
        showCancelButton: true,
        confirmButtonText: 'Sí, borrar',
        cancelButtonText: 'Cancelar',
    }).then((result) => {
        if (result.isConfirmed) {
            fetch('/clear_video_history', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showAlert('Historial de videos borrado correctamente.', 'success');
                    cargarVideosGuardadosHistorial();
                } else {
                    showAlert('Error al borrar el historial.', 'error');
                }
            })
            .catch(error => {
                console.error('Error al limpiar historial:', error);
                showAlert('Error al borrar el historial.', 'error');
            });
        }
    });
}

function limpiarListaGuardados() {
        Swal.fire({
            text: "¿Estás seguro de que deseas eliminar todos los videos guardados?",
            icon: 'warning',
            toast: true,
            position: 'top-right',
            showCancelButton: true,
            confirmButtonText: 'Sí, borrar',
            cancelButtonText: 'Cancelar',
        }).then((result) => {
            if (result.isConfirmed) {
                fetch('/clear_video_list', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showAlert(data.message, 'success');
                        mostrarVideosGuardadosLista([]);
                    } else {
                        showAlert('Error al limpiar la lista de videos.', 'error');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showAlert('Error al limpiar la lista de videos.', 'error');
                });
            }
        });
    }

function cargarGuiaRecurso() {
    fetch('/get_guides', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarGuiaRecurso(data.guide);
        } else {
            console.error('Error al cargar la guía:', data.error);
        }
    })
    .catch(error => {
        console.error('Error al cargar la guía:', error);
    });
}

let guideData = {};

function mostrarGuiaRecurso(guide) {
    guideData = guide;

    const guideContainer = document.getElementById('guideContainer');
    if (guide) {
        let guideHTML = '';
        for (const guideId in guide) {
            guideHTML += `
            <div id="guide-${guideId}" class=" border-b pb-4">
                <h3 class="text-lg font-semibold text-gray-800 mb-2">${guide[guideId].questions}</h3>
                <button onclick="verGuia('${guideId}')"
                        class="text-blue-600 hover:text-blue-800 transition-colors duration-300 ml-4">
                    Ver guía
                </button>
                <button onclick="eliminarGuide('${guideId}')"
                        class="text-red-600 hover:text-red-800 transition-colors duration-300 ml-4">
                    Eliminar
                </button>
            </div>
            `;
        }
        guideContainer.innerHTML = guideHTML;
    } else {
        guideContainer.innerHTML = '';
    }
}

function verGuia(guideId) {
    const guideItem = guideData[guideId];

    if (typeof marked !== "undefined") {
        Swal.fire({
            title: `<h2 class="text-xl font-semibold">${guideItem.questions}</h2>`, 
            html: `<div class="text-sm text-left">${marked.parse(guideItem.answer)}</div>`,
            showCloseButton: true,
            showConfirmButton: false,
            width: '60%',
            confirmButtonText: 'Cerrar',
            customClass: {
                htmlContainer: 'max-h-[70vh] overflow-y-auto',
                closeButton: 'text-gray-500 hover:text-gray-700'
            }
        });
    } else {
        console.error('Error: "marked.js" no está cargado correctamente.');
    }
}

function eliminarGuide(guideId) {
    Swal.fire({
        text: "Esta acción no se puede deshacer.",
        icon: 'warning',
        toast: true,
        position: 'top-right',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/delete_guide/${guideId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const guideElement = document.getElementById(`guide-${guideId}`);
                    if (guideElement) {
                        guideElement.remove();
                    }
                    showAlert('Guía eliminada correctamente.', 'success');
                } else {
                    showAlert('Error al eliminar la guía: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('Hubo un problema al intentar eliminar la guía.');
            });
        }
    });
}

function limpiarListaGuias() {
    Swal.fire({
        text: "Esta acción eliminará todas las guías.",
        icon: 'warning',
        toast: true,
        position: 'top-right',
        showCancelButton: true,
        confirmButtonText: 'Sí, limpiar',
        cancelButtonText: 'Cancelar',
    }).then((result) => {
        if (result.isConfirmed) {
            fetch('/clear_guide', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const guideContainer = document.getElementById('guideContainer');
                    guideContainer.innerHTML = '';

                    showAlert('Todas las guías han sido eliminadas correctamente.', 'success');
                } else {
                    showAlert('Error al eliminar las guías: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('Hubo un problema al intentar eliminar las guías.');
            });
        } 
    });
}

function filtrarGuias(guias, terminoBusqueda) {
    return Object.values(guias).filter(guide => 
        guide.questions && guide.questions.toLowerCase().includes(terminoBusqueda.toLowerCase())
    );
}

function inicializarBusquedaguias() {
    const inputBusqueda = document.getElementById('buscarGuias');
    let timeoutId;
    let guiasOriginales = [];

    fetch('/get_guides')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            guiasOriginales = data.guide;
            mostrarGuiaRecurso(guiasOriginales);
        }
    });

    inputBusqueda.addEventListener('input', (e) => {
        clearTimeout(timeoutId);

        timeoutId = setTimeout(() => {
            const terminoBusqueda = e.target.value.trim();

            if (terminoBusqueda === '') {
                mostrarGuiaRecurso(guiasOriginales);
            } else {
                const guiasFiltrados = filtrarGuias(guiasOriginales, terminoBusqueda);
                mostrarGuiaRecurso(guiasFiltrados);
            }
        }, 300);
    });
}