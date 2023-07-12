/**
 * WebSocket Connection
 * The client sends and receives messages through this WebSocket connection.
 */
const connectButton =  document.getElementById('connect');
let socket;
let clientId = Math.floor(Math.random() * 1000);
function connectSocket() {
  chatWindow.value = "";
  var clientId = Math.floor(Math.random() * 101);
  var ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
  var ws_path = ws_scheme + '://' + window.location.host + `/ws/${clientId}`;
  socket = new WebSocket(ws_path);
  socket.binaryType = 'arraybuffer';

  socket.onopen = (event) => {
    console.log("successfully connected");
    connectMicrophone();
    socket.send("web"); // select web as the platform
  };

  socket.onmessage = (event) => {
    if (typeof event.data === 'string') {
      const message = event.data;
      if (message == '[end]\n') {
        console.log('\nYou> \n');
      } else if (message.startsWith('[+]')) {
        // [+] indicates the transcription is done. stop playing audio
        console.log(message);
      } else if (message.startsWith('[=]')) {
        // [=] indicates the response is done
        chatWindow.value += "\n\n";
        console.log(message);
      } else if (message.startsWith('Select')) {
        console.log("message starts with select");
        parseFisrtMessage(message);
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

connectButton.addEventListener("click", function() {
  console.log("connectButton clicked");
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.close();
  } else {
    connectSocket();
    textContainer.textContent = "Please Select Your character";
  }
});


/**
 * Audio Recording and Transmission
 * captures audio from the user's microphone, which is then sent over the
 * WebSocket connection then sent over the WebSocket connection to the server 
 * when the recording stops.
 */
let mediaRecorder;
let chunks = [];
let debug = false;

function connectMicrophone() {
  console.log("connectMicrophone");
  navigator.mediaDevices.getUserMedia({ audio: true })
  .then(function(stream) {
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = function(e) {
      chunks.push(e.data);
    }

    mediaRecorder.onstart = function() {      
      console.log("start media recorder");
    }

    mediaRecorder.onstop = function(e) {
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
        // Restart the media recorder if user is still connected
        mediaRecorder.start();
      }
    }
  })
  .catch(function(err) {
    console.log('An error occurred: ' + err);
  });
}


/** 
 * Speech Recognition
 * listens for when the user's speech ends and stops the recording.
 */
let recognition;
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
      recognition.start();
    }
  };

  recognition.onstart = function() {
    console.log("start recognizing");
  }
}

/**
 * Voice-based Chatting
 * allows users to start a voice chat.
 */
const talkButton = document.getElementById('talk-btn');
const callButton =  document.getElementById('call');
const playerControls = document.querySelector(".player-controls");
const textContainer = document.querySelector('.text-container p');
const microphoneContainer = document.getElementById('microphone-container');
const microphoneNode = document.getElementById('microphone-node');

callButton.addEventListener("click", () => {
  console.log("callButton clicked");
  microphoneContainer.style.display = 'flex';
  chatWindow.style.display = 'none';
  talkButton.style.display = 'block';
  sendButton.style.display = 'none';
  messageInput.style.display = "none";
  callButton.style.display = "none";
  messageButton.style.display = 'flex';
});

talkButton.addEventListener("click", function() {
  console.log("talkButton clicked");
  if (socket && mediaRecorder) {
    playerControls.style.display = "block";
    microphoneNode.style.display = "none";
    textContainer.textContent = "Hi my friend, what's your name?";

    // Hide the radio buttons that are not selected
    const radioButtons = document.querySelectorAll('.radio-buttons input[type="radio"]');
    radioButtons.forEach(radioButton => {
      if (radioButton.value != selectedCharacter) {
        radioButton.parentElement.style.display = 'none';
      }
    });

    if (selectedCharacter) {
      socket.send(selectedCharacter);
    } else {
      console.log("character not selected");
    }

    mediaRecorder.start();
    speechRecognition();
    recognition.start();
  }
});

/**
 * Text-based Chatting
 * allow users to send text-based messages through the WebSocket connection.
 */
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-btn');
const messageButton = document.getElementById('message');
const chatWindow = document.getElementById('chat-window');

messageButton.addEventListener('click', function() {
  console.log("messageButton clicked");
  microphoneContainer.style.display = 'none';
  chatWindow.style.display = 'block';
  talkButton.style.display = 'none';
  sendButton.style.display = 'block';
  messageInput.style.display = "block";
  callButton.style.display = "flex";
  messageButton.style.display = 'none';
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

/**
 * Character Selection
 * parses the initial message from the server that asks the user to select a 
 * character for the chat. creates radio buttons for the character selection.
 */
let selectedCharacter;
function parseFisrtMessage(message) {
  const options = message.split('\n').slice(1);

  // Create a map from character name to image URL
  // TODO: store image in database and let server send the image url to client.
  const imageMap = {
    'Raiden Shogun And Ei': '/static/raiden.jpeg',
    'Marvel Loki': '/static/loki.jpeg',
    'Ai Character Helper': '/static/ai_helper.png'
  };

  const radioButtonDiv = document.getElementsByClassName('radio-buttons')[0];
  options.forEach(option => {
    const match = option.match(/^(\d+)\s-\s(.+)$/);
    if (match) {
      const label = document.createElement('label');
      label.className = 'custom-radio';

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'radio';
      input.value = match[1];  // The option number is the value

      const span = document.createElement('span');
      span.className = 'radio-btn';
      span.innerHTML = '<i class="las la-check"></i>';

      const hobbiesIcon = document.createElement('div');
      hobbiesIcon.className = 'hobbies-icon';

      const img = document.createElement('img');
      img.src = imageMap[match[2]];

      // Create a h3 element
      const h3 = document.createElement('h4');
      h3.textContent = match[2];  // The option name is the text

      hobbiesIcon.appendChild(img);
      hobbiesIcon.appendChild(h3);
      span.appendChild(hobbiesIcon);
      label.appendChild(input);
      label.appendChild(span);

      radioButtonDiv.appendChild(label);
    }
  });

  radioButtonDiv.addEventListener('change', (event) => {
    if (event.target.value != "") {
      selectedCharacter = event.target.value;
    }
  });
}

/**
 * Audio Playback
 * playing back audio received from the server.
 */
const audioPlayer = document.getElementById('audio-player')
let audioQueue = [];
let audioContext;

// Function to unlock the AudioContext
function unlockAudioContext(audioContext) {
  if (audioContext.state === 'suspended') {
    var unlock = function() {
      audioContext.resume().then(function() {
        document.body.removeEventListener('touchstart', unlock);
        document.body.removeEventListener('touchend', unlock);
      });
    };
    document.body.addEventListener('touchstart', unlock, false);
    document.body.addEventListener('touchend', unlock, false);
  }
}

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

function playAudio(url) {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    unlockAudioContext(audioContext);
  }
  if (!audioPlayer) {
    audioPlayer = document.getElementById('audio-player');
  }
  return new Promise((resolve) => {
    audioPlayer.src = url;
    audioPlayer.muted = true;  // Start muted
    audioPlayer.play();
    audioPlayer.onended = resolve;
    audioPlayer.play().then(() => {
      audioPlayer.muted = false;  // Unmute after playback starts
    }).catch(error => alert(`Playback failed because: ${error}`));
  });
}
