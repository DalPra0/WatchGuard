// ==================================================================================
// FICHEIRO: settings_script.js (para settings.html)
// ==================================================================================
async function updatePassword() {
    const newPassword = document.getElementById('new-password-input').value;
    const statusMessage = document.getElementById('status-message');

    if (!newPassword || !/^[.-]+$/.test(newPassword)) {
        statusMessage.textContent = "Senha inválida. Use apenas '.' e '-'.";
        statusMessage.style.color = 'red';
        return;
    }

    try {
        const response = await fetch('/set_password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: newPassword }),
        });
        const result = await response.json();

        if (result.success) {
            statusMessage.textContent = result.message;
            statusMessage.style.color = 'green';
        } else {
            statusMessage.textContent = `Erro: ${result.message}`;
            statusMessage.style.color = 'red';
        }
    } catch (error) {
        statusMessage.textContent = 'Erro de comunicação com o servidor.';
        statusMessage.style.color = 'red';
        console.error('Error updating password:', error);
    }
}
