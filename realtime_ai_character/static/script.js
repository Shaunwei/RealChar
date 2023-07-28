/**
 * WebSocket Connection
 * The client sends and receives messages through this WebSocket connection.
 */
const connectButton = document.getElementById('connect');
const disconnectButton = document.getElementById('disconnect');
const devicesContainer = document.getElementById('devices-container');
let socket;
let clientId = Math.floor(Math.random() * 10000000);

function connectSocket() {
  chatWindow.value = "";
  var clientId = Math.floor(Math.random() * 1010000);
  var ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
  var ws_path = ws_scheme + '://' + window.location.host + `/ws/${clientId}`;
  socket = new WebSocket(ws_path);
  socket.binaryType = 'arraybuffer';

  socket.onopen = (event) => {
    console.log("successfully connected");
    connectMicrophone(audioDeviceSelection.value);
    speechRecognition();
    socket.send("web"); // select web as the platform
  };

  socket.onmessage = (event) => {
    if (typeof event.data === 'string') {
      const message = event.data;
      if (message == '[end]\n') {
        chatWindow.value += "\n\n";
        chatWindow.scrollTop = chatWindow.scrollHeight;
      } else if (message.startsWith('[+]')) {
        // [+] indicates the transcription is done. stop playing audio
        chatWindow.value += `\nYou> ${message}\n`;
        stopAudioPlayback();
      } else if (message.startsWith('[=]')) {
        // [=] indicates the response is done
        chatWindow.value += "\n\n";
        chatWindow.scrollTop = chatWindow.scrollHeight;
      } else if (message.startsWith('Select')) {
        createCharacterGroups(message);
      } else {
        chatWindow.value += `${event.data}`;
        chatWindow.scrollTop = chatWindow.scrollHeight;

        // if user interrupts the previous response, should be able to play audios of new response
        shouldPlayAudio=true;
      }
    } else {  // binary data
      if (!shouldPlayAudio) {
        return;
      }
      audioQueue.push(event.data);
      if (audioQueue.length === 1) {
        playAudios();
      }
    }
  };

  socket.onerror = (error) => {
    console.log(`WebSocket Error: ${error}`);
  };
  
  socket.onclose = (event) => {
    console.log("Socket closed");
  };
}

connectButton.addEventListener("click", function() {
  connectButton.style.display = "none";
  textContainer.textContent = "Select a character";
  devicesContainer.style.display = "none";
  connectSocket();
  talkButton.style.display = 'flex';
  textButton.style.display = 'flex';
});

disconnectButton.addEventListener("click", function() {
  stopAudioPlayback();
  if (radioGroupsCreated) {
    destroyRadioGroups();
  }
  if (mediaRecorder) {
    mediaRecorder.stop();
  }
  if (recognition) {
    recognition.stop();
  }
  textContainer.textContent = "";
  disconnectButton.style.display = "none";
  playerContainer.style.display = "none";
  stopCallButton.style.display = "none";
  continueCallButton.style.display = "none";
  messageButton.style.display = "none";
  sendButton.style.display = "none";
  messageInput.style.display = "none";
  chatWindow.style.display = "none";
  callButton.style.display = "none";
  connectButton.style.display = "flex";
  devicesContainer.style.display = "flex";
  talkButton.disabled = true;
  textButton.disabled = true;
  chatWindow.value = "";
  selectedCharacter = null;
  characterSent = false;
  callActive = false;
  showRecordingStatus();
  socket.close();
});

/**
 * Devices
 * Get the list of media devices
 */
const audioDeviceSelection = document.getElementById('audio-device-selection');

window.addEventListener("load", function() {
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

/**
 * Audio Recording and Transmission
 * captures audio from the user's microphone, which is then sent over the
 * WebSocket connection then sent over the WebSocket connection to the server 
 * when the recording stops.
 */
let mediaRecorder;
let chunks = [];
let finalTranscripts = [];
let debug = false;
let audioSent = false;

function connectMicrophone(deviceId) {
  navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: deviceId ? {exact: deviceId} : undefined,
      echoCancellation: true
    }
  }).then(function(stream) {
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = function(e) {
      chunks.push(e.data);
    }

    mediaRecorder.onstart = function() {
      console.log("recorder starts");
    }

    mediaRecorder.onstop = function(e) {
      console.log("recorder stops");
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
        if (!audioSent && callActive) {
          console.log("sending audio");
          socket.send(blob);
        }
        audioSent = false;
        if (callActive) {
          mediaRecorder.start();
        }
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
let onresultTimeout;
let onspeechTimeout;
let confidence;
function speechRecognition() {
  // Initialize SpeechRecognition
  window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  recognition.continuous = true;

  recognition.onstart = function() {
    console.log("recognition starts");
  }

  recognition.onresult = function(event) {
    // Clear the timeout if a result is received
    clearTimeout(onresultTimeout);
    clearTimeout(onspeechTimeout);
    stopAudioPlayback()
    const result = event.results[event.results.length - 1];
    const transcriptObj = result[0];
    const transcript = transcriptObj.transcript;
    const ifFinal = result.isFinal;
    if (ifFinal) {
      console.log(`final transcript: {${transcript}}`);
      finalTranscripts.push(transcript);
      confidence = transcriptObj.confidence;
      socket.send(`[&]${transcript}`);
    } else {
      console.log(`interim transcript: {${transcript}}`);
    }
    // Set a new timeout
    onresultTimeout = setTimeout(() => {
      if (ifFinal) {
        return;
      }
      // If the timeout is reached, send the interim transcript
      console.log(`TIMEOUT: interim transcript: {${transcript}}`);
      socket.send(`[&]${transcript}`);
    }, 500); // 500 ms

    onspeechTimeout = setTimeout(() => {
      recognition.stop();
    }, 2000); // 2 seconds
  }

  recognition.onspeechend = function() {
    console.log("speech ends");

    if (socket && socket.readyState === WebSocket.OPEN){
      audioSent = true;
      mediaRecorder.stop();
      if (confidence > 0.8 && finalTranscripts.length > 0) {
        console.log("send final transcript");
        let message = finalTranscripts.join(' ');
        socket.send(message);
        chatWindow.value += `\nYou> ${message}\n`;
        chatWindow.scrollTop = chatWindow.scrollHeight;
        shouldPlayAudio = true;
      }
    }
    finalTranscripts = [];
  };

  recognition.onend = function() {
    console.log("recognition ends");
    if (socket && socket.readyState === WebSocket.OPEN && callActive){
      recognition.start();
    }
  };
}

/**
 * Voice-based Chatting
 * allows users to start a voice chat.
 */
const talkButton = document.getElementById('talk-btn');
const textButton = document.getElementById('text-btn');
const callButton =  document.getElementById('call');
const textContainer = document.querySelector('.header p');
const playerContainer = document.getElementById('player-container');
const soundWave = document.getElementById('sound-wave');
const stopCallButton = document.getElementById('stop-call');
const continueCallButton = document.getElementById('continue-call');
let callActive = false;

callButton.addEventListener("click", () => {
  playerContainer.style.display = 'flex';
  chatWindow.style.display = 'none';
  sendButton.style.display = 'none';
  messageInput.style.display = "none";
  callButton.style.display = "none";
  messageButton.style.display = 'flex';

  if (callActive) {
    stopCallButton.style.display = 'flex';
    soundWave.style.display = 'flex';
  } else {
    continueCallButton.style.display = 'flex';
  }
  showRecordingStatus();
});

stopCallButton.addEventListener("click", () => {
  soundWave.style.display = "none";
  stopCallButton.style.display = "none";
  continueCallButton.style.display = "flex";

  callActive = false;
  mediaRecorder.stop();
  recognition.stop();
  stopAudioPlayback();
  showRecordingStatus();
})

continueCallButton.addEventListener("click", () => {
  stopCallButton.style.display = "flex";
  continueCallButton.style.display = "none";
  soundWave.style.display = "flex";

  mediaRecorder.start();
  recognition.start();
  callActive = true;
  showRecordingStatus();
});

function showRecordingStatus() {
  // show recording status
  if (mediaRecorder.state == "recording") {
    recordingStatus.style.display = "inline-block";
  } else {
    recordingStatus.style.display = "none";
  }
}

talkButton.addEventListener("click", function() {
  if (socket && socket.readyState === WebSocket.OPEN && mediaRecorder && selectedCharacter) {
    playerContainer.style.display = "flex";

    talkButton.style.display = "none";
    textButton.style.display = 'none';
    disconnectButton.style.display = "flex";
    messageButton.style.display = "flex";
    stopCallButton.style.display = "flex";
    soundWave.style.display = "flex";
    textContainer.textContent = "Hi, my friend, what brings you here today?";
    shouldPlayAudio=true;

    socket.send(selectedCharacter);
    hideOtherCharacters();

    mediaRecorder.start();
    recognition.start();
    callActive = true;
    showRecordingStatus();
  }
});

textButton.addEventListener("click", function() {
  if (socket && socket.readyState === WebSocket.OPEN && mediaRecorder && selectedCharacter) {
    messageButton.click();
    disconnectButton.style.display = "flex";
    textContainer.textContent = "";
    shouldPlayAudio=true;

    socket.send(selectedCharacter);
    hideOtherCharacters();
    showRecordingStatus();
  }
});

function hideOtherCharacters() {
  // Hide the radio buttons that are not selected
  const radioButtons = document.querySelectorAll('.radio-buttons input[type="radio"]');
  radioButtons.forEach(radioButton => {
    if (radioButton.value != selectedCharacter) {
      radioButton.parentElement.style.display = 'none';
    }
  });
}

/**
 * Text-based Chatting
 * allow users to send text-based messages through the WebSocket connection.
 */
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-btn');
const messageButton = document.getElementById('message');
const chatWindow = document.getElementById('chat-window');
const recordingStatus = document.getElementById("recording");
let characterSent = false;

messageButton.addEventListener('click', function() {
  playerContainer.style.display = 'none';
  chatWindow.style.display = 'block';
  talkButton.style.display = 'none';
  textButton.style.display = 'none';
  sendButton.style.display = 'block';
  messageInput.style.display = "block";
  callButton.style.display = "flex";
  messageButton.style.display = 'none';
  continueCallButton.style.display = 'none';
  stopCallButton.style.display = 'none';
  soundWave.style.display = "none";

  showRecordingStatus();
});

const sendMessage = () => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    const message = messageInput.value;
    chatWindow.value += `\nYou> ${message}\n`;
    chatWindow.scrollTop = chatWindow.scrollHeight;
    socket.send(message);
    messageInput.value = "";
    if (isPlaying) {
      stopAudioPlayback();
    }
  }
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
let radioGroupsCreated = false;

function createCharacterGroups(message) {
  const options = message.split('\n').slice(1);

  // Create a map from character name to image URL
  // TODO: store image in database and let server send the image url to client.
  const imageMap = {
    'Raiden Shogun And Ei': '/static/raiden.svg',
    'Loki': '/static/loki.svg',
    'Ai Character Helper': '/static/ai_helper.png',
    'Reflection Pi': '/static/pi.jpeg',
    'Elon Musk': '/static/elon.png',
    'Bruce Wayne': '/static/bruce.png',
    'Steve Jobs': '/static/jobs.png',
    'Sam Altman': '/static/sam.png',
    'Mark Zuckerberg': '/static/mark_zuckerberg.png',
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
      let src = imageMap[match[2]];
      if (!src) {
        src = '/static/realchar.svg';
      }
      img.src = src;

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

    talkButton.disabled = false;
    textButton.disabled = false;
  });

  radioGroupsCreated = true;
}

function destroyRadioGroups() {
  const radioButtonDiv = document.getElementsByClassName('radio-buttons')[0];
  while (radioButtonDiv.firstChild) {
    radioButtonDiv.removeChild(radioButtonDiv.firstChild);
  }
  selectedCharacter = null;
  radioGroupsCreated = false;
}

// This function will add or remove the pulse animation
function togglePulseAnimation() {
  const selectedRadioButton = document.querySelector('.custom-radio input:checked + .radio-btn');

  if (isPlaying && selectedRadioButton) {
    // Remove existing pulse animations
    selectedRadioButton.classList.remove("pulse-animation-1");
    selectedRadioButton.classList.remove("pulse-animation-2");

    // Add a new pulse animation, randomly choosing between the two speeds
    const animationClass = Math.random() > 0.5 ? "pulse-animation-1" : "pulse-animation-2";
    selectedRadioButton.classList.add(animationClass);
  } else if (selectedRadioButton) {
    selectedRadioButton.classList.remove("pulse-animation-1");
    selectedRadioButton.classList.remove("pulse-animation-2");
  }
}

/**
 * Audio Playback
 * playing back audio received from the server.
 */
const audioPlayer = document.getElementById('audio-player')
let audioQueue = [];
let audioContext;
let shouldPlayAudio = false;
let isPlaying = false;

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
  isPlaying = true;
  togglePulseAnimation();
  while (audioQueue.length > 0) {
    let data = audioQueue[0];
    let blob = new Blob([data], { type: 'audio/mp3' });
    let audioUrl = URL.createObjectURL(blob);
    await playAudio(audioUrl);
    audioQueue.shift();
  }
  isPlaying = false;
  togglePulseAnimation();
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

function stopAudioPlayback() {
  if (audioPlayer) {
    audioPlayer.pause();
    shouldPlayAudio = false;
  }
  audioQueue = [];
  isPlaying = false;
  togglePulseAnimation();
}
