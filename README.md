# 🛡️ WatchGuard: Sistema de Segurança e Monitoramento Inteligente 🛡️

## Visão Geral do Projeto

O **WatchGuard** é um sistema de segurança e monitoramento residencial inovador, projetado para oferecer tranquilidade e controlo. Ele integra monitoramento de vídeo em tempo real, deteção de movimento inteligente e um sistema de armar/desarmar exclusivo via código Morse, controlado por um dispositivo ESP32. Com uma interface web intuitiva, você tem acesso completo aos logs de eventos e às gravações de segurança, tudo na palma da sua mão.

Este projeto modular combina hardware (ESP32) com um poderoso backend em Python (Flask com OpenCV) e um frontend responsivo, criando uma solução de segurança robusta e personalizável.

## ✨ Funcionalidades Principais

* **🎥 Monitoramento de Vídeo Versátil:**
    * Suporte para **Webcam do PC local**.
    * Modo de **simulação com ficheiro de vídeo pré-gravado**.
    * Conectividade com **câmeras RTSP (IP)** para vigilância profissional.
* **🚨 Deteção de Movimento Inteligente:**
    * Utiliza a biblioteca **OpenCV** para identificar movimentos no feed de vídeo com precisão.
    * Gravação automática de vídeo por **10 segundos** (configurável) quando o movimento é detetado e o sistema está armado.
* **📜 Logs Detalhados e Histórico:**
    * Registra todos os eventos importantes: deteções de movimento, operações de armar/desarmar e atualizações de senha.
    * Os logs são armazenados em `logs.json` no servidor e também no **cartão SD do ESP32**, garantindo redundância e acesso.
* **🔑 Controlo com ESP32 e Código Morse:**
    * Interface direta com um módulo **ESP32** através de comunicação serial.
    * Arme ou desarme o sistema utilizando uma **senha Morse** configurável, introduzida por um botão físico.
    * **Feedback sonoro (buzzer)** do ESP32 para indicar sucesso, falha na senha ou alarme de movimento.
* **🌐 Interface Web Intuitiva (Flask):**
    * **Dashboard em tempo real:** Visualize o feed da câmera e o status atual do sistema (Armado/Desarmado).
    * **Gestão de Gravações:** Navegue, liste e reproduza facilmente todas as gravações de movimento.
    * **Visualização e Filtro de Logs:** Acesse e filtre o histórico de eventos por tipo e data.
    * **Configuração de Segurança:** Altere a senha Morse do sistema de forma conveniente.

## 🛠️ Tecnologias Utilizadas

### Backend (Python 3)

* **Flask:** Framework web leve e poderoso para o servidor e API RESTful.
* **OpenCV (`cv2`):** Essencial para o processamento de imagem, análise de vídeo e deteção de movimento.
* **PySerial (`serial`):** Habilita a comunicação serial bidirecional com o ESP32.
* **Threading:** Para gerenciar eficientemente tarefas em segundo plano, como escuta serial e processamento contínuo de vídeo.
* Módulos padrão: `datetime`, `os`, `json`, `re`, `mimetypes`.

### Frontend (HTML5, CSS3, JavaScript)

* **`style.css`:** Estilização moderna e responsiva da interface.
* **JavaScript (Fetch API, manipulação DOM):** Para interações dinâmicas, atualização de dados em tempo real e consumo da API do Flask.
* Páginas HTML: `primeira.html`, `home.html`, `camera_page.html`, `log_detail.html`, `settings.html`.
* Scripts JS: `camera_script.js`, `dashboard_script.js`, `home_script.js`, `log_detail_script.js`, `settings_script.js`.

### Hardware

* **ESP32:** O microcontrolador central para a interface física.
* **Cartão SD:** Para armazenamento de logs no lado do microcontrolador.
* **Buzzer:** Para alertas sonoros e feedback.
* **Botão:** Entrada para a senha Morse.

### Software Adicional

* **FFmpeg:** Recomendado para o `cv2.VideoCapture` ao trabalhar com streams RTSP.

## 📂 Estrutura do Projeto

```
.
├── ApresentacaoCameraPC.py         # 🚀 Servidor Flask: Modo Webcam Local do PC
├── simulacaoApresentacao.py        # 🎬 Servidor Flask: Modo Simulação (vídeo pré-gravado)
├── super_server_morse.py           # 📡 Servidor Flask: Modo Câmera RTSP (IP)
├── WatchGuard.ino                  # 🤖 Código Arduino para o ESP32
├── recordings/                     # 🗄️ Diretório para salvar gravações de vídeo
├── logs.json                       # 📄 Ficheiro JSON com logs do servidor
└── static/                         # 🌐 Ficheiros estáticos da interface web
    ├── style.css                   # Estilos CSS
    ├── primeira.html               # Página Inicial / Dashboard
    ├── home.html                   # Página do Dashboard (pode ser redundante com primeira.html)
    ├── camera_page.html            # Página de visualização da câmera
    ├── log_detail.html             # Página de detalhes de logs
    ├── settings.html               # Página de configurações
    ├── camera_script.js            # Lógica JS para a página da câmera
    ├── dashboard_script.js         # Lógica JS para o dashboard
    ├── home_script.js              # Lógica JS para a página inicial
    ├── log_detail_script.js        # Lógica JS para detalhes de logs
    └── settings_script.js          # Lógica JS para a página de configurações
```

## 🚀 Configuração e Instalação

### Pré-requisitos

* **Python 3.x**
* **`pip`** (gerenciador de pacotes Python)
* **Arduino IDE** ou **PlatformIO** para o desenvolvimento do ESP32.
* Um módulo **ESP32** com botão, buzzer e leitor de cartão SD conectados.
* Uma câmera (webcam do PC, ficheiro de vídeo local ou câmera IP).
* Se usar câmeras RTSP, **FFmpeg** pode ser necessário no seu sistema.

### 📦 Instalação das Dependências Python

No diretório raiz do projeto, execute:

```bash
pip install Flask opencv-python pyserial
```

### ⚙️ Configuração do ESP32

1.  Abra o ficheiro `WatchGuard.ino` no Arduino IDE ou PlatformIO.
2.  Instale as bibliotecas necessárias via Gerenciador de Bibliotecas: `SPI`, `SD`, `FS`, e `ArduinoJson`.
3.  Conecte seu ESP32.
4.  **Importante:** Verifique e ajuste a variável `SERIAL_PORT` nos scripts Python (`ApresentacaoCameraPC.py`, `simulacaoApresentacao.py`, `super_server_morse.py`) para corresponder à porta serial do seu ESP32 (ex: `/dev/cu.usbserial-0001` no macOS/Linux ou `COMx` no Windows).
5.  Faça o upload do código para o ESP32.

### 📁 Criação do Diretório de Gravações

O diretório `recordings` será criado automaticamente na primeira execução do servidor, se não existir.

## ▶️ Como Executar o Projeto

Escolha o modo de operação desejado para o servidor Python:

### 💻 Modo Webcam do PC (Ideal para testes rápidos com webcam integrada)

```bash
python ApresentacaoCameraPC.py
```

### 🎬 Modo Simulação (Para demonstrações sem hardware de câmera)

Certifique-se de que o ficheiro `simulacao.mp4` está no mesmo diretório do script.

```bash
python simulacaoApresentacao.py
```

### 📹 Modo Câmera RTSP (Para integração com câmeras IP)

**Não esqueça de editar a variável `RTSP_URL` no ficheiro `super_server_morse.py` com o endereço da sua câmera IP.**

```bash
python super_server_morse.py
```

Após iniciar o servidor, acesse a interface web em seu navegador:

[http://127.0.0.1:5000](http://127.0.0.1:5000)

## 🎯 Uso do Sistema

* **Página Inicial (`/` ou `/primeira.html`):** Seu dashboard central para monitoramento em tempo real e visualização do status.
* **Logs (`/logs`):** Explore um histórico completo de eventos, com filtros para facilitar a busca.
* **Gravações (`/recordings`):** Revise e reproduza os vídeos de segurança capturados.
* **Configurações (`/settings`):** Personalize sua senha Morse para armar/desarmar o sistema.
* **Controlo Físico (ESP32):** Use o botão conectado ao ESP32 para introduzir a senha Morse e alterar o estado de armar/desarmar.

## 🤝 Contribuição

Sinta-se à vontade para contribuir! Seja reportando bugs, sugerindo novas funcionalidades ou enviando pull requests, sua ajuda é muito bem-vinda.

## 📄 Licença

Este projeto é licenciado sob a [MIT License](LICENSE).
