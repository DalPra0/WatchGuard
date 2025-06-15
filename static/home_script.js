// ==================================================================================
// FICHEIRO: home_script.js (Com lógica de filtro e link para vídeo)
// ==================================================================================
function formatTimestamp(unixTimestampMillis) {
    if (!unixTimestampMillis) return "N/A";
    return new Date(unixTimestampMillis).toLocaleString('pt-BR');
}

async function fetchLogs() {
    const logEntriesDiv = document.getElementById('log-entries');

    // Pega os valores dos filtros
    const logType = document.getElementById('log-type').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    // Constrói a URL com os parâmetros de filtro
    const params = new URLSearchParams();
    if (logType) params.append('type', logType);
    if (startDate) params.append('start_date', new Date(startDate).getTime());
    if (endDate) params.append('end_date', new Date(endDate).getTime());

    const url = `/logs?${params.toString()}`;

    try {
        const response = await fetch(url);
        const logs = await response.json();

        logEntriesDiv.innerHTML = '';
        if (logs.length === 0) {
            logEntriesDiv.innerHTML = '<p>Nenhum evento encontrado para os filtros selecionados.</p>';
            return;
        }

        logs.forEach(log => {
            const logItem = document.createElement('div');
            logItem.className = 'log-item';

            let detailsHTML = log.details;
            // NOVO: Verifica se o log é de câmera e tem um ficheiro de vídeo associado
            if (log.type === 'Camera' && typeof log.details === 'object' && log.details.video_file) {
                detailsHTML = `
                    ${log.details.message} 
                    <a href="/recordings/${log.details.video_file}" target="_blank" class="video-link">
                        (Ver Vídeo)
                    </a>
                `;
            }

            logItem.innerHTML = `
                <p><strong>[${log.type}]</strong> ${detailsHTML}</p>
                <p style="font-size: 0.8em; color: #666;">${formatTimestamp(log.timestamp)}</p>
            `;
            logEntriesDiv.appendChild(logItem);
        });
    } catch (error) {
        console.error("Erro ao buscar logs:", error);
        logEntriesDiv.innerHTML = '<p>Erro ao carregar logs.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchLogs();
});
