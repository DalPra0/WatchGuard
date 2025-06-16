if (document.getElementById('log-detail-container')) {
    document.addEventListener('DOMContentLoaded', async () => {
        const params = new URLSearchParams(window.location.search);
        const logTimestamp = params.get('timestamp');
        const container = document.getElementById('log-detail-container');
        if (!logTimestamp) {
            container.innerHTML = '<h1>Erro</h1><p>Nenhum timestamp de log fornecido.</p>';
            return;
        }
        try {
            const response = await fetch('/logs');
            const allLogs = await response.json();
            const targetLog = allLogs.find(log => log.timestamp == logTimestamp);
            if (!targetLog) {
                container.innerHTML = '<h1>Erro</h1><p>Log não encontrado.</p>';
                return;
            }
            let videoHTML = '';
            if (targetLog.type === 'Camera' && typeof targetLog.details === 'object' && targetLog.details.video_file) {
                videoHTML = `<h2>Vídeo do Evento</h2>
                    <video width="100%" controls autoplay>
                        <source src="/recordings/${targetLog.details.video_file}" type="video/mp4">
                        Seu navegador não suporta o elemento de vídeo.
                    </video>`;
            }
            let detailsText = typeof targetLog.details === 'object' ? JSON.stringify(targetLog.details).replace(/"/g, '') : targetLog.details;
            container.innerHTML = `<h1>Detalhe do Evento</h1>
                <div class="log-item">
                    <p><strong>Tipo:</strong> ${targetLog.type}</p>
                    <p><strong>Data/Hora:</strong> ${new Date(targetLog.timestamp).toLocaleString('pt-BR')}</p>
                    <p><strong>Detalhes:</strong> ${detailsText}</p>
                </div>
                ${videoHTML}`;
        } catch (error) {
            container.innerHTML = '<h1>Erro</h1><p>Falha ao carregar dados do servidor.</p>';
        }
    });
}