const socket = io({
  transports: ['websocket'],
  upgrade: false,
  forceNew: true,
  reconnection: true,
  timeout: 60000
});

const localAudio = document.getElementById("localAudio");
const remoteAudio = document.getElementById("remoteAudio");
const transcriptionBox = document.getElementById("transcription");
const callPopup = document.getElementById("callPopup");
const btnCall = document.getElementById("btnCall");

let localStream = null;
let mediaRecorder = null;
let peerConnection = null;

document.getElementById('btnCall').addEventListener('click', handleCallButton);
document.getElementById('btnStopCall').addEventListener('click', stopCall);
document.getElementById('btnMute').addEventListener('click', function() {
  toggleMute(this);
});
document.getElementById('btnShowText').addEventListener('click', showTranscription);
// document.getElementById('btnClosePopup').addEventListener('click', closeCallPopup);

const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// Lấy media stream âm thanh của bạn
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    localStream = stream;
    localAudio.srcObject = stream;
  })
  .catch(err => {
    alert("Không thể truy cập microphone: " + err);
  });

// Socket nhận offer từ người khác
socket.on("offer", async (offer) => {
  openCallPopup();
  peerConnection = new RTCPeerConnection(config);
  setupPeerEvents();

  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("answer", answer);
  } catch (err) {
    console.error("Lỗi xử lý offer:", err);
  }
});

// Socket nhận answer
socket.on("answer", async (answer) => {
  if (!peerConnection) return;
  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  } catch (err) {
    console.error("Lỗi xử lý answer:", err);
  }
});

// Socket nhận ICE candidate
socket.on("ice", (candidate) => {
  if (peerConnection) {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
      .catch(e => console.error("Lỗi thêm ICE candidate:", e));
  }
});

// Socket nhận transcript text
socket.on("transcript", (text) => {
  const output = document.getElementById("output");
  output.innerText += ' ' + text;
});

function startSendingAudioStream() {
  if (!localStream) return;

  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
  }

  try {
    mediaRecorder = new MediaRecorder(localStream, { mimeType: 'audio/webm' });
  } catch (e) {
    alert("MediaRecorder không được hỗ trợ hoặc lỗi khởi tạo: " + e);
    return;
  }

  mediaRecorder.start(250); // Mỗi 250ms gửi 1 chunk

  mediaRecorder.ondataavailable = e => {
    if (e.data && e.data.size > 0) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const arrayBuffer = reader.result;
        socket.emit('audio', arrayBuffer);
      };
      reader.readAsArrayBuffer(e.data);
    }
  };

  mediaRecorder.onerror = (event) => {
    console.error("MediaRecorder error:", event.error);
  };
}

function setupPeerEvents() {
  if (!peerConnection) return;

  peerConnection.onicecandidate = (e) => {
    if (e.candidate) socket.emit("ice", e.candidate);
  };

  peerConnection.ontrack = (e) => {
    remoteAudio.srcObject = e.streams[0];
  };

  if (localStream) {
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
  }
}

// Hàm bật popup và bắt đầu gọi
function startCall() {
  peerConnection = new RTCPeerConnection(config);
  setupPeerEvents();

  peerConnection.createOffer()
    .then(offer => peerConnection.setLocalDescription(offer).then(() => offer))
    .then(offer => {
      socket.emit("offer", offer);
    })
    .catch(err => {
      alert("Lỗi khi tạo offer: " + err);
      console.error(err);
    });
}

// Dừng cuộc gọi, đóng kết nối, dừng ghi âm, ẩn popup
function stopCall() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;

    remoteAudio.srcObject = null;

    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    }
  }
  closeCallPopup();
}

// Xử lý nút gọi
function handleCallButton() {
  openCallPopup();
  startCall();
  startSendingAudioStream();
}

// Bật / tắt tiếng micro
function toggleMute(button) {
  if (!localStream) return;

  localStream.getAudioTracks().forEach(track => {
    track.enabled = !track.enabled;
  });

  if (button.innerText === "🔇 Tắt tiếng") {
    button.innerText = "🎤 Bật tiếng";
  } else {
    button.innerText = "🔇 Tắt tiếng";
  }
}

// Mở popup cuộc gọi
function openCallPopup() {
  callPopup.classList.remove("hidden");
  btnCall.disabled = true;
  btnCall.style.backgroundColor = "gray";
}

// Đóng popup cuộc gọi
function closeCallPopup() {
  callPopup.classList.add("hidden");
  btnCall.disabled = false;
  btnCall.style.backgroundColor = "";
}

// Hiển thị khung transcription nếu đang ẩn
function showTranscription() {
  transcriptionBox.style.display = "block";
  transcriptionBox.focus();
}
