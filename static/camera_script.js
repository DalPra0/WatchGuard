function fetchRecordings() {
    const recordingsListDiv = document.getElementById('recordings-list');
    if (!recordingsListDiv) return;

    fetch(`/list_recordings`)
        .then(response => response.json())
        .then(files => {
            recordingsListDiv.innerHTML = '';
            if (files.length === 0) {
                recordingsListDiv.innerHTML = '<p>Nenhuma gravação encontrada.</p>';
                return;
            }
            files.forEach(filename => {
                const recordingItem = document.createElement('div');
                recordingItem.className = 'recording-item';
                recordingItem.innerHTML = `<p><strong>Gravação: ${filename}</strong></p>
                    <video width="100%" controls preload="metadata">
                        <source src="/recordings/${filename}" type="video/mp4">
                        Seu navegador não suporta o elemento de vídeo.
                    </video>`;
                recordingsListDiv.appendChild(recordingItem);
            });
        })
        .catch(error => {
            recordingsListDiv.innerHTML = '<p>Erro ao carregar gravações.</p>';
        });
}
// Verifica se estamos na página da câmera antes de adicionar o listener
if (document.getElementById('live-stream-img')) {
    document.addEventListener('DOMContentLoaded', () => {
        const liveStreamImg = document.getElementById('live-stream-img');
        const liveStreamStatus = document.getElementById('live-stream-status');
        liveStreamImg.src = `/video_feed`;
        liveStreamImg.onload = () => { liveStreamStatus.textContent = "Stream da câmera ativo."; liveStreamStatus.style.color = "green"; };
        liveStreamImg.onerror = () => { liveStreamStatus.textContent = "Erro ao carregar o stream."; liveStreamStatus.style.color = "red"; };
        fetchRecordings();
    });
}
