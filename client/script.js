// Buttons
const connectButton = document.getElementById("connect");
const startButton = document.getElementById("start");
const stopButton = document.getElementById("stop");
const sendAudioButton = document.getElementById("send-audio");
const sendTextButton = document.getElementById("send-text");

const messageInput = document.getElementById("message-input");
const log = document.getElementById("log");
const audioContainer = document.getElementById("audio-container");


let recognition;
let socket;
let clientId = Math.floor(Math.random() * 1000);
// Queue for audio data
let audioQueue = [];

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
    audioContainer.appendChild(audio); // add this line
  });
}


// websocket connection
connectButton.addEventListener("click", () => {
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
        console.log('\nYou: ');
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


startButton.addEventListener("click", () => {
  log.value += "Starting...\n";

  recognition = new window.webkitSpeechRecognition();
  recognition.interimResults = true;
  recognition.lang = "en-US";
  recognition.start();

  recognition.onresult = (event) => {
    const speechResult = event.results[event.results.length - 1][0].transcript;
    log.value += `You: ${speechResult}\n`;
  };

  recognition.onerror = (event) => {
    log.value += `Error occurred in recognition: ${event.error}\n`;
  }
});

stopButton.addEventListener("click", () => {
  log.value += "Stopping...\n";
  recognition.stop();
  // socket.close();
});

sendAudioButton.addEventListener("click", () => {
  socket.send(log.value);
});

sendTextButton.addEventListener("click", () => {
  const message = messageInput.value;
  log.value += `You: ${message}\n`;
  socket.send(message);
  messageInput.value = "";
});


window.addEventListener("beforeunload", function(event) {
  console.trace("Page is about to unload");
  console.log(event);
});

window.addEventListener("unload", function(event) {
  console.trace("Page is unloading");
  console.log(event);
});