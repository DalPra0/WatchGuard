import cv2
import time
import os
import serial
import threading
import mimetypes
import json
import re
from datetime import datetime
from flask import Flask, Response, jsonify, send_from_directory, request

# RTSP_URL = 'rtsp://admin:lucasdpb1907@192.168.242.55:554/cam/realmonitor?channel=1&subtype=1' # <-- DESATIVADO TEMPORARIAMENTE
VIDEO_SOURCE = "simulacao.mp4"
SERIAL_PORT = '/dev/cu.usbserial-0001'
BAUD_RATE = 115200

RECORDINGS_DIR = "recordings"
LOG_FILE = "logs.json"
MOTION_SENSITIVITY = 1500
RECORDING_SECONDS = 10

app = Flask(__name__, static_folder='static', static_url_path='')
system_armed = True
logs = []
last_frame = None
ser = None
morse_password = "..."
video_lock = threading.Lock()
logs_lock = threading.Lock()

def load_logs():
    global logs
    with logs_lock:
        try:
            if os.path.exists(LOG_FILE):
                with open(LOG_FILE, 'r') as f:
                    logs = json.load(f)
                    print(f"{len(logs)} logs carregados de {LOG_FILE}.")
            else:
                logs = []
        except Exception as e:
            print(f"Erro ao carregar logs: {e}. A começar com uma lista de logs vazia.")
            logs = []

def save_logs():
    global logs
    with logs_lock:
        try:
            with open(LOG_FILE, 'w') as f:
                json.dump(logs, f, indent=4)
        except Exception as e:
            print(f"Erro ao guardar logs: {e}")

def add_log(log_type, details):
    global logs
    log_entry = { "type": log_type, "details": details, "timestamp": int(time.time() * 1000) }
    with logs_lock:
        logs.insert(0, log_entry)
    print(f"Log Adicionado: {log_entry}")
    save_logs()

def serial_listener():
    global system_armed, ser
    while True:
        if ser and ser.is_open:
            try:
                line = ser.readline().decode('utf-8').strip()
                if line.startswith("MORSE:"):
                    received_code = line.replace("MORSE:", "").strip()
                    if received_code == morse_password:
                        system_armed = not system_armed
                        status = "ARMADO" if system_armed else "DESARMADO"
                        add_log("Controlo", f"Senha Morse correta. Sistema {status}.")
                        ser.write(b"BUZZ_SUCCESS\n")
                    else:
                        add_log("Controlo", f"Tentativa de senha Morse falhou: '{received_code}'")
                        ser.write(b"BUZZ_FAIL\n")
            except (serial.SerialException, UnicodeDecodeError):
                print("Erro na comunicação serial. A tentar reconectar...")
                time.sleep(3)
        else:
            time.sleep(3)

def video_processing():
    global last_frame, system_armed, video_lock
    print("A iniciar processamento de vídeo a partir do ficheiro local (modo de apresentação)...")

    cap = cv2.VideoCapture(VIDEO_SOURCE)

    if not cap.isOpened():
        print(f"ERRO FATAL: Não foi possível abrir o ficheiro de vídeo '{VIDEO_SOURCE}'.")
        print("Certifique-se de que o ficheiro 'simulacao.mp4' está na mesma pasta que este script.")
        return

    print("Ficheiro de simulação carregado. A iniciar processamento.")
    previous_frame = None
    is_recording = False
    recording_start_time = 0
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Fim do vídeo de simulação, reiniciando o loop...")
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue

        with video_lock:
            _, buffer = cv2.imencode('.jpg', frame)
            last_frame = buffer.tobytes()
        if not system_armed:
            if is_recording:
                is_recording = False
                video_writer.release()
            previous_frame = None
            time.sleep(0.5)
            continue
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (21, 21), 0)
        if previous_frame is None:
            previous_frame = gray
            continue
        frame_delta = cv2.absdiff(previous_frame, gray)
        thresh = cv2.threshold(frame_delta, 30, 255, cv2.THRESH_BINARY)[1]
        thresh = cv2.dilate(thresh, None, iterations=2)
        contours, _ = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        motion_detected = any(cv2.contourArea(c) > MOTION_SENSITIVITY for c in contours)
        if motion_detected and not is_recording:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"rec_{timestamp}.mp4"
            add_log("Camera", {"message": "Movimento detectado (simulado)", "video_file": filename})
            if ser and ser.is_open: ser.write(b"BUZZ_ALARM\n")
            is_recording = True
            recording_start_time = time.time()
            filepath = os.path.join(RECORDINGS_DIR, filename)
            height, width, _ = frame.shape
            video_writer = cv2.VideoWriter(filepath, fourcc, 15.0, (width, height))
            print(f"A gravar em {filepath}...")
        if is_recording:
            video_writer.write(frame)
            if time.time() - recording_start_time > RECORDING_SECONDS:
                is_recording = False
                video_writer.release()
                print("Gravação concluída.")
        previous_frame = gray
        time.sleep(0.05)

@app.route('/<path:path>')
def serve_static_files(path):
    return send_from_directory('static', path)
@app.route('/')
def index():
    return send_from_directory('static', 'primeira.html')
@app.route('/logs')
def get_logs():
    global logs
    with logs_lock:
        log_type_filter = request.args.get('type', default=None, type=str)
        start_date_filter = request.args.get('start_date', default=None, type=int)
        end_date_filter = request.args.get('end_date', default=None, type=int)
        filtered_logs = logs
        if log_type_filter and log_type_filter != 'All':
            filtered_logs = [log for log in filtered_logs if log['type'] == log_type_filter]
        if start_date_filter:
            filtered_logs = [log for log in filtered_logs if log['timestamp'] >= start_date_filter]
        if end_date_filter:
            filtered_logs = [log for log in filtered_logs if log['timestamp'] <= end_date_filter]
        return jsonify(filtered_logs)

@app.route('/recordings/<path:filename>')
def serve_recording(filename):
    path = os.path.join(os.getcwd(), RECORDINGS_DIR, filename)
    if not os.path.exists(path): return "Ficheiro não encontrado", 404
    range_header = request.headers.get('Range', None)
    size = os.path.getsize(path)
    if not range_header:
        with open(path, 'rb') as f:
            return Response(f.read(), mimetype=mimetypes.guess_type(path)[0])
    byte1, byte2 = 0, None
    m = re.search('(\\d+)-(\\d*)', range_header)
    if not m: return "Range header inválido", 400
    g = m.groups()
    if g[0]: byte1 = int(g[0])
    if g[1]: byte2 = int(g[1])
    length = size - byte1
    if byte2 is not None: length = byte2 - byte1 + 1
    data = None
    with open(path, 'rb') as f:
        f.seek(byte1)
        data = f.read(length)
    rv = Response(data, 206, mimetype=mimetypes.guess_type(path)[0], direct_passthrough=True)
    rv.headers.add('Content-Range', f'bytes {byte1}-{byte1 + len(data) - 1}/{size}')
    return rv

@app.route('/status')
def get_status():
    return jsonify({"armed": system_armed, "status_text": "ARMADO" if system_armed else "DESARMADO"})

@app.route('/set_password', methods=['POST'])
def set_password():
    global morse_password
    data = request.get_json()
    new_password = data.get('password')
    if new_password and all(c in '.-' for c in new_password):
        morse_password = new_password
        add_log("System", f"Senha Morse atualizada para: '{morse_password}'")
        return jsonify({"success": True, "message": "Senha atualizada com sucesso."})
    return jsonify({"success": False, "message": "Senha inválida."}), 400

def gen_frames():
    global last_frame, video_lock
    while True:
        time.sleep(0.05)
        with video_lock:
            if last_frame:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + last_frame + b'\r\n')
@app.route('/video_feed')
def video_feed():
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/list_recordings')
def list_recordings():
    files = sorted([f for f in os.listdir(RECORDINGS_DIR) if f.endswith('.mp4')], reverse=True)
    return jsonify(files)

if __name__ == '__main__':
    if not os.path.exists(RECORDINGS_DIR): os.makedirs(RECORDINGS_DIR)
    load_logs()
    add_log("System", "Servidor iniciado.")
    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=2)
        print(f"Conectado ao ESP32 na porta {SERIAL_PORT}")
    except serial.SerialException as e:
        print(f"Erro fatal: Não foi possível conectar ao ESP32. Verifique a porta. {e}")
        exit()
    threading.Thread(target=serial_listener, daemon=True).start()
    threading.Thread(target=video_processing, daemon=True).start()
    print("Servidor web a correr em http://127.0.0.1:5000")
    app.run(host='0.0.0.0', port=5000)