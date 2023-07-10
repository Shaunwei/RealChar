// Buttons
const microphoneContainer = document.getElementById('microphone-container');
const chatWindow = document.getElementById('chat-window');
const callButton =  document.getElementById('call');
const messageButton = document.getElementById('message');
const talkButton = document.getElementById('talk-btn');
const sendButton = document.getElementById('send-btn');
const messageInput = document.getElementById('message-input');
const audioPlayer = document.getElementById('audio-player')
var playerControls = document.querySelector(".player-controls");

let recognition;
let socket;
let clientId = Math.floor(Math.random() * 1000);
let audioQueue = [];
let mediaRecorder;
let chunks = [];
let debug = false;

function connectSocket() {
  chatWindow.value = "";
  chatWindow.value += "Connecting...\n";

  var clientId = Math.floor(Math.random() * 101);
  var ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
  var ws_path = ws_scheme + '://' + window.location.host + `/ws/${clientId}`;
  socket = new WebSocket(ws_path);
  socket.binaryType = 'arraybuffer';  // necessary to receive binary data

  socket.onopen = (event) => {
    chatWindow.value += "Successfully Connected.\n\n";

    connectMicrophone();
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
        chatWindow.value += `${event.data}`;
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
}

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


function connectMicrophone() {
  console.log("connectMicrophone");
  navigator.mediaDevices.getUserMedia({ audio: true })
  .then(function(stream) {
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = function(e) {
      chunks.push(e.data);
    }

    mediaRecorder.onstart = function() {
      chatWindow.value += "\nListening...\n";
      console.log("start media recorder");
    }

    mediaRecorder.onstop = function(e) {
      chatWindow.value += "\nThinking...\n";
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
        console.log("sent audio")
        socket.send(blob);
      }
    }
  })
  .catch(function(err) {
    console.log('An error occurred: ' + err);
  });
}

// Function to play an audio and return a Promise that resolves when the audio finishes playing
function playAudio(url) {
  return new Promise((resolve) => {
    audioPlayer.controls = true;
    audioPlayer.src = url;
    audioPlayer.onended = resolve;
    audioPlayer.play();
  });
}

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

talkButton.addEventListener("click", function() {
  if (mediaRecorder) {
    mediaRecorder.start();
    speechRecognition();
    recognition.start();
  }
});

messageButton.addEventListener('click', function() {
  microphoneContainer.style.display = 'none';
  chatWindow.style.display = 'block';
  talkButton.style.display = 'none';
  sendButton.style.display = 'block';
  messageInput.style.display = "block";
});

callButton.addEventListener("click", () => {
  microphoneContainer.style.display = 'flex';
  chatWindow.style.display = 'none';
  talkButton.style.display = 'block';
  sendButton.style.display = 'none';
  messageInput.style.display = "none";
});

const sendMessage = () => {
  const message = messageInput.value;
  chatWindow.value += `\nYou> ${message}\n`;
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

connectSocket();