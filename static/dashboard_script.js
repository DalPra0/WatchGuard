function updateStatus() {
    fetch('/status')
        .then(response => response.json())
        .then(data => {
            const statusElement = document.getElementById('system-status');
            if (statusElement) {
                statusElement.textContent = data.status_text;
                statusElement.style.color = data.armed ? 'red' : 'green';
            }
        })
        .catch(error => console.error('Erro ao buscar status:', error));
}
if (document.getElementById('system-status')) {
    document.addEventListener('DOMContentLoaded', () => {
        updateStatus();
        setInterval(updateStatus, 3000);
    });
}