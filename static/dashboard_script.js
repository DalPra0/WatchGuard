// ==================================================================================
// FICHEIRO: dashboard_script.js (para primeira.html)
// ==================================================================================
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
document.addEventListener('DOMContentLoaded', () => {
    updateStatus();
    setInterval(updateStatus, 3000); // Atualiza o estado a cada 3 segundos
});