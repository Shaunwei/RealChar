// Buttons
const connectButton = document.getElementById("connect");
const endButton = document.getElementById("end-connection");
const startAudioButton = document.getElementById("start-audio");
const stopAudioButton = document.getElementById("stop-audio");
const sendButton = document.getElementById("send");
const messageInput = document.getElementById("message-input");
const log = document.getElementById("log");
const imageDisplay = document.getElementById("image-display");

let recognition;
let socket;
let clientId = Math.floor(Math.random() * 1000);
// Queue for audio data
let audioQueue = [];

window.addEventListener("load", function() {
  let audioDeviceSelection = document.getElementById('audio-device-selection');

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


// Play audio function
async function playAudios() {
  while (audioQueue.length > 0) {
    let data = audioQueue[0];
    let blob = new Blob([data], { type: 'audio/mp3' });
    let audioUrl = URL.createObjectURL(blob);
    await playAudio(audioUrl);
    audioQueue.shift();
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
  log.value = "";
  log.value += "Connecting...\n";

  socket = new WebSocket(`ws://localhost:8000/ws/${clientId}`);
  socket.binaryType = 'arraybuffer';  // necessary to receive binary data

  socket.onopen = (event) => {
    log.value += "Successfully Connected.\n\n";
  };

  socket.onmessage = (event) => {
    console.trace(`Message received:${event.data}`);
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
        log.value += `${event.data}`;
      }
    } else {  // binary data
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
    log.value += "Connection Ended.\n";
  }
});

sendButton.addEventListener("click", () => {
  const message = messageInput.value;
  log.value += `\nYou> ${message}\n`;
  socket.send(message);
  messageInput.value = "";
});