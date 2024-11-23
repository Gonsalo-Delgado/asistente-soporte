function hideAlert() {
    const alert = document.getElementById('alertMessage');
    if (alert) {
        alert.style.opacity = '0';
        setTimeout(() => {
            alert.style.display = 'none';
        }, 500);
    }
}

if (document.getElementById('alertMessage')) {
    setTimeout(hideAlert, 2000);
}