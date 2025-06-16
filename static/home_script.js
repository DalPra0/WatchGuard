function formatTimestamp(unixTimestampMillis) {
    if (!unixTimestampMillis) return "N/A";
    return new Date(unixTimestampMillis).toLocaleString('pt-BR');
}
async function fetchLogs() {
    const logEntriesDiv = document.getElementById('log-entries');
    if (!logEntriesDiv) return;

    const logType = document.getElementById('log-type').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
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
            let detailsText = typeof log.details === 'object' ? (log.details.message || JSON.stringify(log.details)) : log.details;
            logItem.innerHTML = `<a href="/log_detail.html?timestamp=${log.timestamp}" class="log-link">
                    <p><strong>[${log.type}]</strong> ${detailsText}</p>
                    <p style="font-size: 0.8em; color: #666;">${formatTimestamp(log.timestamp)}</p>
                </a>`;
            logEntriesDiv.appendChild(logItem);
        });
    } catch (error) {
        logEntriesDiv.innerHTML = '<p>Erro ao carregar logs.</p>';
    }
}
if (document.getElementById('log-entries')) {
    document.addEventListener('DOMContentLoaded', fetchLogs);
}