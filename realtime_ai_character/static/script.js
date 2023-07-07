// Buttons
const connectButton = document.getElementById("connect");
const endButton = document.getElementById("end-connection");
const startTalkingButton = document.getElementById("start-talking");
const sendButton = document.getElementById("send");

const messageInput = document.getElementById("message-input");
const log = document.getElementById("log");

const imageUploadForm = document.getElementById("image-upload-form");
const imageUpload = document.getElementById("image-upload");
const imageDisplay = document.getElementById("image-display");


let recognition;
let socket;
let clientId = Math.floor(Math.random() * 1000);
// Queue for audio data
let audioQueue = [];


// Initially disable 'Start Talking' and 'Send' buttons
startTalkingButton.disabled = true;
sendButton.disabled = true;

imageUploadForm.addEventListener("submit", function(event) {
  event.preventDefault();  // prevent the form from submitting normally
  if (imageUpload.files && imageUpload.files[0]) {
      let reader = new FileReader();
      reader.onload = function(e) {
          // Set the source of the image element to the uploaded file
          imageDisplay.src = e.target.result;
      }
      reader.readAsDataURL(imageUpload.files[0]);
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

  var clientId = Math.floor(Math.random() * 101);
  var ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
  var ws_path = ws_scheme + '://' + window.location.host + `/ws/${clientId}`;
  socket = new WebSocket(ws_path);
  // socket = new WebSocket(`ws://5649-98-42-233-44.ngrok-free.app/ws/${clientId}`);
  socket.binaryType = 'arraybuffer';  // necessary to receive binary data

  socket.onopen = (event) => {
    log.value += "Successfully Connected.\n\n";

    // Enable 'Start Talking' and 'Send' buttons on successful connection
    startTalkingButton.disabled = false;
    sendButton.disabled = false;
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

    // Disable 'Start Talking' and 'Send' buttons on error
    startTalkingButton.disabled = true;
    sendButton.disabled = true;
  };
  
  socket.onclose = (event) => {
    console.trace("Socket closed");

    // Disable 'Start Talking' and 'Send' buttons when connection closes
    startTalkingButton.disabled = true;
    sendButton.disabled = true;
  };
});

endButton.addEventListener("click", () => {
  if (socket) {
    socket.close();
    log.value += "Connection Ended.\n";

    // Disable 'Start Talking' and 'Send' buttons when connection closes
    startTalkingButton.disabled = true;
    sendButton.disabled = true;
  }
});


startTalkingButton.addEventListener("click", () => {
  log.value += "Starting...\n";

  recognition = new window.webkitSpeechRecognition();
  recognition.interimResults = true;
  recognition.lang = "en-US";
  recognition.start();

  recognition.onresult = (event) => {
    const speechResult = event.results[event.results.length - 1][0].transcript;
    log.value += `\nYou> ${speechResult}\n`;
  };

  recognition.onerror = (event) => {
    log.value += `Error occurred in recognition: ${event.error}\n`;
  }
});

// stopTalkingButton.addEventListener("click", () => {
//   log.value += "Stopping...\n";
//   recognition.stop();
//   // socket.close();
// });


sendButton.addEventListener("click", () => {
  const message = messageInput.value;
  log.value += `\nYou> ${message}\n`;
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
