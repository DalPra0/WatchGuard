function formatTimestamp(unixTimestampMillis) {
    if (!unixTimestampMillis) return "N/A";
    return new Date(unixTimestampMillis).toLocaleString('pt-BR');
}

document.addEventListener('DOMContentLoaded', async () => {
    // Procura o elemento no DOM para garantir que este script só corre na página certa
    const container = document.getElementById('log-detail-container');
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const logTimestamp = params.get('timestamp');

    if (!logTimestamp) {
        container.innerHTML = '<h1>Erro</h1><p>Nenhum timestamp de log fornecido.</p>';
        return;
    }

    try {
        // Pede todos os logs ao servidor
        const response = await fetch('/logs');
        const allLogs = await response.json();

        // Encontra o log específico pelo timestamp que veio na URL
        const targetLog = allLogs.find(log => log.timestamp == logTimestamp);

        if (!targetLog) {
            container.innerHTML = '<h1>Erro</h1><p>Log não encontrado.</p>';
            return;
        }

        let videoHTML = '';
        let detailsText = '';

        // --- LÓGICA DE EXIBIÇÃO CORRIGIDA ---
        if (targetLog.type === 'Camera' && typeof targetLog.details === 'object' && targetLog.details.video_file) {
            // Se for um log de Câmera, extrai a mensagem e cria o player de vídeo
            detailsText = targetLog.details.message;
            videoHTML = `
                <h2>Vídeo do Evento</h2>
                <video width="100%" max-width="640px" controls autoplay muted>
                    <source src="/recordings/${targetLog.details.video_file}" type="video/mp4">
                    Seu navegador não suporta o elemento de vídeo.
                </video>
            `;
        } else if (typeof targetLog.details === 'object') {
            // Se for outro tipo de log com detalhes em JSON, apenas formata
            detailsText = JSON.stringify(targetLog.details);
        } else {
            // Para logs simples de texto
            detailsText = targetLog.details;
        }

        // Constrói o HTML final da página
        container.innerHTML = `
            <h1>Detalhe do Evento</h1>
            <div class="log-item">
                <p><strong>Tipo:</strong> ${targetLog.type}</p>
                <p><strong>Data/Hora:</strong> ${formatTimestamp(targetLog.timestamp)}</p>
                <p><strong>Detalhes:</strong> ${detailsText}</p>
            </div>
            ${videoHTML}
        `;

    } catch (error) {
        console.error("Erro ao carregar detalhes do log:", error);
        container.innerHTML = '<h1>Erro</h1><p>Falha ao carregar dados do servidor.</p>';
    }
});
