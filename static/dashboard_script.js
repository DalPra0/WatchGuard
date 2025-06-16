function updateStatus() {
    fetch('/status')
        .then(response => response.json())
        .then(data => {
            const statusElement = document.getElementById('system-status');
            statusElement.textContent = data.status_text;
            statusElement.style.color = data.armed ? 'red' : 'green';
        })
        .catch(error => console.error('Erro ao buscar status:', error));
}
// O event listener para o dashboard é auto-contido.
if (document.getElementById('system-status')) {
    document.addEventListener('DOMContentLoaded', () => {
        updateStatus();
        setInterval(updateStatus, 3000);
    });
}
