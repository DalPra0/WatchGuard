// ==================================================================================
// FICHEIRO: camera_script.js (Sem alterações significativas, mas aqui para referência)
// ==================================================================================
document.addEventListener('DOMContentLoaded', () => {
    const liveStreamImg = document.getElementById('live-stream-img');
    const liveStreamStatus = document.getElementById('live-stream-status');

    liveStreamImg.src = `/video_feed`;

    liveStreamImg.onload = () => {
        liveStreamStatus.textContent = "Stream da câmera ativo.";
        liveStreamStatus.style.color = "green";
    };
    liveStreamImg.onerror = () => {
        liveStreamStatus.textContent = "Erro ao carregar o stream da câmera.";
        liveStreamStatus.style.color = "red";
    };

    fetchRecordings();
});

async function fetchRecordings() {
    const recordingsListDiv = document.getElementById('recordings-list');
    try {
        const response = await fetch(`/list_recordings`);
        const files = await response.json();

        recordingsListDiv.innerHTML = '';
        if (files.length === 0) {
            recordingsListDiv.innerHTML = '<p>Nenhuma gravação encontrada.</p>';
            return;
        }

        files.forEach(filename => {
            const recordingItem = document.createElement('div');
            recordingItem.className = 'recording-item';
            // A tag de vídeo agora deve funcionar corretamente por causa do novo backend
            recordingItem.innerHTML = `
                <p><strong>Gravação: ${filename}</strong></p>
                <video width="100%" max-width="480px" controls preload="metadata">
                    <source src="/recordings/${filename}" type="video/mp4">
                    Seu navegador não suporta o elemento de vídeo.
                </video>
            `;
            recordingsListDiv.appendChild(recordingItem);
        });
    } catch (error) {
        console.error("Erro ao buscar gravações:", error);
        recordingsListDiv.innerHTML = '<p>Erro ao carregar gravações.</p>';
    }
}
