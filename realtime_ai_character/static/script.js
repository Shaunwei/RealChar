// We use MediaStream Recording API more suitable for longer recordings as it's designed to 
// handle streaming of media data as opposed to the Web Audio API which is more suitable for 
// processing and synthesizing audio in web applications.

// Buttons
const connectButton = document.getElementById("connect");
const endButton = document.getElementById("end-connection");
const startCallButton = document.getElementById("start-call");
const sendButton = document.getElementById("send");

const messageInput = document.getElementById("message-input");
const chat = document.getElementById("chat");

const imageDisplay = document.getElementById("image-display");
const audioDeviceSelection = document.getElementById('audio-device-selection');

let recognition;
let socket;
let clientId = Math.floor(Math.random() * 1000);
let audioQueue = [];

// MediaStream API
let mediaRecorder;
let chunks = [];

let debug = false;

startCallButton.disabled = true;

window.addEventListener("load", function() {
  // Get the list of media devices
  navigator.mediaDevices.enumerateDevices()
    .then(function(devices) {
      // Filter out the audio input devices
      let audioInputDevices = devices.filter(function(device) {
        return device.kind === 'audioinput';
      });

      // If there are no audio input devices, display an error and return
      if (audioInputDevices.length === 0) {
        console.log('No audio input devices found');
        return;
      }

      // Add the audio input devices to the dropdown
      audioInputDevices.forEach(function(device, index) {
        let option = document.createElement('option');
        option.value = device.deviceId;
        option.textContent = device.label || `Microphone ${index + 1}`;
        audioDeviceSelection.appendChild(option);
      });
    })
    .catch(function(err) {
      console.log('An error occurred: ' + err);
    });
});

audioDeviceSelection.addEventListener('change', function(e) {
  connectMicrophone(e.target.value);
});

function speechRecognition() {
  // Initialize SpeechRecognition
  window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();

  // Stop the recorder when user stops talking
  recognition.onspeechend = function() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      console.log("user stops talking");
    }
  };

  // Handle the case where user does not speak
  recognition.onend = function() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      console.log("recognizer ends");
    }
  };

  recognition.onstart = function() {
    console.log("start recognizing");
  }
}


function connectMicrophone(deviceId) {
  navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: deviceId ? {exact: deviceId} : undefined,
      sampleRate: 44100,
      echoCancellation: true
    }
  })
  .then(function(stream) {
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = function(e) {
      chunks.push(e.data);
    }

    mediaRecorder.onstart = function() {
      chat.value += "\nListening...\n";
      console.log("start media recorder");
    }

    mediaRecorder.onstop = function(e) {
      chat.value += "\nThinking...\n";
      console.log("stops media recorder")
      let blob = new Blob(chunks, {'type' : 'audio/webm'});
      chunks = [];

      if (debug) {
          // Save the audio
          let url = URL.createObjectURL(blob);
          let a = document.createElement("a");
          document.body.appendChild(a);
          a.style = "display: none";
          a.href = url;
          a.download = 'test.webm';
          a.click();
      }

      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(blob);
      }
    }

    startCallButton.disabled = false;
  })
  .catch(function(err) {
    console.log('An error occurred: ' + err);
  });
}

startCallButton.addEventListener("click", function() {
  if (mediaRecorder) {
    mediaRecorder.start();

    startCallButton.disabled = true;
    speechRecognition();
    recognition.start();
  }
});

// Play audio function
async function playAudios() {
  while (audioQueue.length > 0) {
    let data = audioQueue[0];
    let blob = new Blob([data], { type: 'audio/mp3' });
    let audioUrl = URL.createObjectURL(blob);
    await playAudio(audioUrl);
    audioQueue.shift();
  }

  // Start recording again after audio is done playing
  if (mediaRecorder && mediaRecorder.state !== "recording") {
    mediaRecorder.start();

    if (recognition) {
      recognition.start();
    }
  }
}

// Function to play an audio and return a Promise that resolves when the audio finishes playing
function playAudio(url) {
  return new Promise((resolve) => {
    let audio = new Audio();
    audio.controls = true;
    audio.src = url;
    audio.onended = resolve;
    audio.play();
  });
}

// websocket connection
connectButton.addEventListener("click", () => {
chat.value = "";
chat.value += "Connecting...\n";

  var clientId = Math.floor(Math.random() * 101);
  var ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
  var ws_path = ws_scheme + '://' + window.location.host + `/ws/${clientId}`;
  socket = new WebSocket(ws_path);
  socket.binaryType = 'arraybuffer';  // necessary to receive binary data

  socket.onopen = (event) => {
    chat.value += "Successfully Connected.\n\n";
    // send the client platform to the server
    socket.send("web");
    connectMicrophone(audioDeviceSelection.value);
  };

  socket.onmessage = (event) => {
    if (typeof event.data === 'string') {
      const message = event.data;
      if (message == '[end]\n') {
        console.log('\nYou> \n');
      } else if (message.startsWith('[+]')) {
        // stop playing audio
        // Note: JavaScript doesn't have built-in audio stop functionality for the Audio object.
        // You need to implement it manually if you have a playing audio track.
        console.log(message);
      } else if (message.startsWith('[=]')) {
        // indicate the response is done
        console.log(message);
      } else {
      chat.value += `${event.data}`;
      }
    } else {  // binary data
      console.log("start playing received audio");
      audioQueue.push(event.data);
      if (audioQueue.length === 1) {
        playAudios();
      }
    }
  };

  socket.onerror = (error) => {
    console.trace("Socket closed");
    console.log(`WebSocket Error: ${error}`);
  };

  socket.onclose = (event) => {
    console.trace("Socket closed");
  };
});

endButton.addEventListener("click", () => {
  if (socket) {
    socket.close();
  chat.value += "Connection Ended.\n";

    startCallButton.disabled = true;
  }
});

const sendMessage = () => {
  const message = messageInput.value;
chat.value += `\nYou> ${message}\n`;
  socket.send(message);
  messageInput.value = "";
}

sendButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
});
