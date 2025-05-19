import os
os.environ['EVENTLET_NO_GREENDNS'] = '1'
import eventlet
eventlet.monkey_patch()
import wave
import subprocess
import json
import tempfile
from flask import Flask, send_from_directory, request
from flask_socketio import SocketIO, emit

# model = Model("model")
# Khởi tạo Flask và SocketIO
app = Flask(__name__, static_folder="public")
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode='eventlet',
    logger=True,
    engineio_logger=True,
    ping_timeout=20,  # Tăng timeout để tránh ngắt kết nối sớm
    ping_interval=25
)

# Lưu trữ danh sách client
clients = set()

# Route phục vụ index.html và các file tĩnh
@app.route("/", methods=["GET", "POST"])
def index():
    return send_from_directory("public", "index.html")

@app.route("/<path:path>")
def static_files(path):
    return send_from_directory("public", path)
    
# WebSocket events
@socketio.on("connect")
def handle_connect():
    clients.add(request.sid)
    print(f"Client connected: {request.sid}")
    emit("connect", {"sid": request.sid})  # Gửi SID về client
@socketio.on("audio")
def handle_audio(data_audio):
    print(f"Received audio data from {request.sid} ({len(data_audio)} bytes)")

    try:
        # Ghi dữ liệu webm ra file tạm
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as webm_file:
            webm_file.write(data_audio)
            webm_path = webm_file.name

        # Chuyển webm sang wav bằng ffmpeg
        wav_path = webm_path.replace(".webm", ".wav")
        subprocess.run([
            "ffmpeg", "-y", "-i", webm_path,
            "-ar", "16000", "-ac", "1", wav_path
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        # Load wav để nhận diện
        wf = wave.open(wav_path, "rb")
        if wf.getnchannels() != 1 or wf.getframerate() != 16000:
            print("WAV format not supported")
            return

        # rec = model.predict( wf.getframerate())

        while True:
            data = wf.readframes(4000)
            if len(data) == 0:
                break
            if rec.AcceptWaveform(data):
                result = json.loads(rec.Result())
                text = result.get("text", "")
                if text:
                    emit('transcript', text)

        final = json.loads(rec.FinalResult())
        if final.get("text", ""):
            emit("transcript", final["text"])

    except Exception as e:
        print(f"[ERROR] Audio processing failed: {e}")
    finally:
        # Dọn file tạm
        try:
            os.remove(webm_path)
            os.remove(wav_path)
        except:
            pass

@socketio.on("disconnect")
def handle_disconnect():
    if request.sid in clients:
        clients.remove(request.sid)
    print(f"Client disconnected: {request.sid}")

@socketio.on("offer")
def handle_offer(data):
    print(f"Received offer from {request.sid}: {data}")
    for sid in clients:
        if sid != request.sid:  # Không gửi lại cho client gửi offer
            emit("offer", data, room=sid)

@socketio.on("answer")
def handle_answer(data):
    print(f"Received answer from {request.sid}: {data}")
    for sid in clients:
        if sid != request.sid:  # Không gửi lại cho client gửi answer
            emit("answer", data, room=sid)

@socketio.on("ice")
def handle_ice(data):
    print(f"Received ICE candidate from {request.sid}: {data}")
    for sid in clients:
        if sid != request.sid:  # Không gửi lại cho client gửi ICE
            emit("ice", data, room=sid)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))  # Sử dụng cổng 5000 mặc định thay vì 3000
    socketio.run(app, host='0.0.0.0', port=port, debug=False)