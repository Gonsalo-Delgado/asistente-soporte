function loadView(view) {
    localStorage.setItem('currentView', view);
    fetch(view)
        .then(response => response.text())
        .then(html => {
            document.getElementById('content').innerHTML = html;
            initializeViewHandlers(view);
        });
    updateActiveMenuItem(view);
}

function initializeViewHandlers(view) {
    switch(view) {
        case 'assistant':
            initializeAssistantHandlers();
            break;
        case 'faq':
            initializeResourcesHandlers();
            break;
        case 'resources':
            initializeResourcesHandlers();
            break;
        case 'settings':
            initializeSettingsHandlers();
            break;
    }
}

function handleLogout(event) {

    event.preventDefault();
    
    localStorage.clear();

    const logoutUrl = event.currentTarget.href;
    
    window.location.href = logoutUrl;
}

function initializeResourcesHandlers() {
    cargarVideosGuardadosHistorial();
    cargarVideosGuardadosLista();
    inicializarBusquedaVideos();
    inicializarBusquedaguias();
    cargarUltimaVista();
    cargarGuiaRecurso();
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                buscarVideos();
            }
        });
    }
    
    const searchButton = document.getElementById('searchButton');
    if (searchButton) {
        searchButton.addEventListener('click', buscarVideos);
    }
    
    const logoutLink = document.querySelector('a[href*="logout"]');
    if (logoutLink) {
        logoutLink.addEventListener('click', handleLogout);
    }
}

function updateActiveMenuItem(view) {
    document.querySelectorAll('.menu-item').forEach(item => {
        if (item.getAttribute('onclick').includes(view)) {
            item.classList.add('bg-gray-100');
        } else {
            item.classList.remove('bg-gray-100');
        }
    });
}

function getInitialView() {
    return localStorage.getItem('currentView') || 'assistant';
}

document.addEventListener('DOMContentLoaded', () => {
    const initialView = getInitialView();
    loadView(initialView);
    
    const logoutLink = document.querySelector('a[href*="logout"]');
    if (logoutLink) {
        logoutLink.addEventListener('click', handleLogout);
    }
});