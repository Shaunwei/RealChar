import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import MobileWarning from './components/MobileWarning';
import MediaDevices from './components/MediaDevices';
import TextView from './components/TextView';
import CallView from './components/CallView';
import Button from './components/Common/Button';
import Alert from './components/Common/Alert';

import { Characters, createCharacterGroups } from './components/Characters';
import { TbMessageChatbot, TbPower, TbMicrophone } from 'react-icons/tb';

const App = () => {
  const [selectedDevice, setSelectedDevice] = useState('');
  // socket connection
  const socket = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  // Talk
  const [isTalkView, setIsTalkView] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  // media recorder
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);
  const debug = false;
  const [audioSent, setAudioSent] = useState(false);
  const [callActive, setCallActive] = useState(false);
  // characters
  const [characterConfirmed, setCharacterConfirmed] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [characterGroups, setCharacterGroups] = useState([]);
  // header
  const [headerText, setHeaderText] = useState("");
  // speech recognition
  const recognition = useRef(null);
  const onresultTimeout = useRef(null);
  const onspeechTimeout = useRef(null);
  const [confidence, setConfidence] = useState(0);
  const [finalTranscripts, setFinalTranscripts] = useState([]);
  const [shouldPlayAudio, setShouldPlayAudio] = useState(false);
  // audio
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioQueue, setAudioQueue] = useState([]);
  const audioPlayer = useRef(null);
  const audioContextRef = useRef(null);

  const connectMicrophone = (deviceId) => {
    // logic to connect the microphone
    console.log("connectMicrophone");
    navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: deviceId ? {exact: deviceId} : undefined,
        echoCancellation: true
      }
    }).then(function(stream) {
      let mr = new MediaRecorder(stream);
  
      mr.ondataavailable = function(e) {
        chunks.current.push(e.data);
      }
  
      mr.onstart = function() {
        console.log("recorder starts");
      }
  
      mr.onstop = function(e) {
        console.log("recorder stops");
        let blob = new Blob(chunks.current, {'type' : 'audio/webm'});
        chunks.current = [];
  
        // TODO: replace this with react
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
            socket.current.send(blob);
          }
          setAudioSent(false);
          if (callActive) {
            mr.start();
          }
        }
      }

      mediaRecorder.current = mr;
    })
    .catch(function(err) {
      console.log('An error occurred: ' + err);
    });
  }

  // socket connection
  const connectSocket = () => {
    // chatWindow.value = "";

    const clientId = Math.floor(Math.random() * 1010000);
    const ws_scheme = window.location.protocol === "https:" ? "wss" : "ws";
    // const ws_path = ws_scheme + '://realchar.ai:8000/ws/' + clientId;
    // Get the current host value
    var currentHost = window.location.host;

    // Split the host into IP and port number
    var parts = currentHost.split(':');

    // Extract the IP address and port number
    var ipAddress = parts[0];
    var currentPort = parts[1];

    // Define the new port number
    var newPort = '8000';

    // Generate the new host value with the same IP but different port
    var newHost = ipAddress + ':' + newPort;

    const ws_path = ws_scheme + '://' + newHost + `/ws/${clientId}`;
    console.log(`ws_path ${ws_path}`);

    let sk = new WebSocket(ws_path);
    sk.binaryType = 'arraybuffer';

    sk.onopen = (event) => {
      console.log("successfully connected");
      setIsConnected(true);
      connectMicrophone(selectedDevice);
      initializeSpeechRecognition();
      sk.send("web"); // select web as the platform
    };

    sk.onmessage = (event) => {
      if (typeof event.data === 'string') {
        const message = event.data;
        if (message === '[end]\n') {
          // chatWindow.value += "\n\n";
          // chatWindow.scrollTop = chatWindow.scrollHeight;
        } else if (message.startsWith('[+]')) {
          // [+] indicates the transcription is done. stop playing audio
          // chatWindow.value += `\nYou> ${message}\n`;
          stopAudioPlayback();
        } else if (message.startsWith('[=]')) {
          // [=] indicates the response is done
          // chatWindow.value += "\n\n";
          // chatWindow.scrollTop = chatWindow.scrollHeight;
        } else if (message.startsWith('Select')) {
          setCharacterGroups(createCharacterGroups(message));
        } else {
          // chatWindow.value += `${event.data}`;
          // chatWindow.scrollTop = chatWindow.scrollHeight;

          // if user interrupts the previous response, should be able to play audios of new response
          console.log("onmessage so should play audio");
          setShouldPlayAudio(true);
        }
      } else {  // binary data
        console.log(`received audio data. shouldPlayAudio? ${shouldPlayAudio}`);
        if (!shouldPlayAudio) {
          console.log("should not play audio");
          return;
        }
        setAudioQueue(prevAudioQueue => [...prevAudioQueue, event.data]);
        if (audioQueue.length === 1) {
          playAudios();
        }
      }
    };

    sk.onerror = (error) => {
      console.log(`WebSocket Error: ${error}`);
    };

    sk.onclose = (event) => {
      console.log("Socket closed");
    };

    socket.current = sk;
  };

  const handleConnectButtonClick = () => {
    console.log("connect button clicked");
    connectSocket();
    setHeaderText("Select a character");
  };

  const handleTalkClick = () => {
    console.log("talk clicked");
    if (socket.current && socket.current.readyState === WebSocket.OPEN && mediaRecorder.current && selectedCharacter) {
      socket.current.send(selectedCharacter);

      setCharacterConfirmed(true);
      setIsTalkView(true);
      setIsRecording(true);
      console.log("talk button so should play audio");
      setShouldPlayAudio(true);
      setHeaderText("Hi, my friend, what brings you here today?");
      mediaRecorder.current.start();
      recognition.current.start();
      setCallActive(true);
    }
  }

  const handleTextClick = () => {
    console.log("text clicked");
    if (socket.current && socket.current.readyState === WebSocket.OPEN && mediaRecorder.current && selectedCharacter) {
      socket.current.send(selectedCharacter);    

      setCharacterConfirmed(true);
      setHeaderText("");
      // chatWindow.value += "Hi, my friend, what brings you here today?\n";
      console.log("text button so should play audio");
      setShouldPlayAudio(true);
      setIsTalkView(false);
    }
  }

  const handleStopCall = () => {
    console.log("call stopped");
    setIsRecording(false);
    setCallActive(false);
    mediaRecorder.current.stop();
    recognition.current.stop();
    stopAudioPlayback();
  }

  const handleContinueCall = () => {
    console.log("call continue");
    mediaRecorder.current.start();
    recognition.current.start();
    setIsRecording(true);
    setCallActive(true);
  }

  const handleDisconnect = () => {
    console.log("disconnect");
    stopAudioPlayback();
    socket.current.close();
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
    }
    if (recognition.current) {
      recognition.current.stop();
    }

    socket.current = null;
    setIsConnected(false);
    setCharacterConfirmed(false);
    setIsTalkView(false);
    setIsRecording(false);
    mediaRecorder.current = null;
    chunks.current = []
    setAudioSent(false);
    setCallActive(false);
    setSelectedCharacter(null);
    setHeaderText("");
  }

  const handleMessageClick = () => {
    setIsTalkView(false);
  }

  const handleCallClick = () => {
    setIsTalkView(true);
  }

  const initializeSpeechRecognition = () => {
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let sr = new window.SpeechRecognition();
    sr.interimResults = true;
    sr.maxAlternatives = 1;
    sr.continuous = true;

    sr.onstart = () => {
      console.log('recognition starts');
    };

    sr.onresult = (event) => {
      // Clear the timeout if a result is received
      clearTimeout(onresultTimeout.current);
      clearTimeout(onspeechTimeout.current);
      stopAudioPlayback();
      const result = event.results[event.results.length - 1];
      const transcriptObj = result[0];
      const transcript = transcriptObj.transcript;
      const ifFinal = result.isFinal;
      if (ifFinal) {
        console.log(`final transcript: {${transcript}}`);
        setFinalTranscripts((prevTranscripts) => [...prevTranscripts, transcript]);
        setConfidence(transcriptObj.confidence);
        socket.current.send(`[&]${transcript}`);
      } else {
        console.log(`interim transcript: {${transcript}}`);
      }
      // Set a new timeout
      onresultTimeout.current = setTimeout(() => {
        if (ifFinal) {
          return;
        }
        // If the timeout is reached, send the interim transcript
        console.log(`TIMEOUT: interim transcript: {${transcript}}`);
        socket.current.send(`[&]${transcript}`);
      }, 500); // 500 ms

      onspeechTimeout.current = setTimeout(() => {
        sr.stop();
      }, 2000); // 2 seconds
    };

    sr.onspeechend = () => {
      console.log('speech ends');

      if (socket.current && socket.current.readyState === WebSocket.OPEN) {
        setAudioSent(true);
        mediaRecorder.current.stop();
        if (confidence > 0.8 && finalTranscripts.length > 0) {
          console.log('send final transcript');
          let message = finalTranscripts.join(' ');
          socket.current.send(message);
          // chatWindow.value += `\nYou> ${message}\n`;
          // chatWindow.scrollTop = chatWindow.scrollHeight;
          console.log("on speech end confidence great should play audio");
          setShouldPlayAudio(true);
        }
      }

      setFinalTranscripts([]);
    };

    sr.onend = () => {
      console.log('recognition ends');
      if (socket.current && socket.current.readyState === WebSocket.OPEN && callActive) {
        sr.start();
      }
    };

    recognition.current = sr;
  };

  const unlockAudioContext = (audioContext) => {
    if (audioContext.state === 'suspended') {
      const unlock = function() {
        audioContext.resume().then(function() {
          document.body.removeEventListener('touchstart', unlock);
          document.body.removeEventListener('touchend', unlock);
        });
      };
      document.body.addEventListener('touchstart', unlock, false);
      document.body.addEventListener('touchend', unlock, false);
    }
  };

  const playAudios = async () => {
    console.log("playing audio");
    setIsPlaying(true);
    while (audioQueue.length > 0) {
      let data = audioQueue[0];
      let blob = new Blob([data], { type: 'audio/mp3' });
      let audioUrl = URL.createObjectURL(blob);
      await playAudio(audioUrl);
      setAudioQueue(oldQueue => oldQueue.slice(1));
    }
    setIsPlaying(false);
  }

  const playAudio = (url) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      unlockAudioContext(audioContextRef.current);
    }

    return new Promise((resolve) => {
      audioPlayer.current.src = url;
      audioPlayer.current.muted = true;  // Start muted
      audioPlayer.current.play();
      audioPlayer.current.onended = resolve;
      audioPlayer.current.play().then(() => {
        audioPlayer.current.muted = false;  // Unmute after playback starts
      }).catch(error => alert(`Playback failed because: ${error}`));
    });
  }

  const stopAudioPlayback = () => {
    if (audioPlayer.current) {
      audioPlayer.current.pause();
      console.log("stopAudioPlayback so should not play audio");
      setShouldPlayAudio(false);
    }
    setAudioQueue([]);
    setIsPlaying(false);
  }

  return (
    <div className='body'>
      <Header />
      <MobileWarning />

      <div id="desktop-content">
        <Alert text="Please wear headphone 🎧" />
        { isConnected && characterConfirmed && isRecording ? (<span className="recording">Recording</span>) : null}

        { !isConnected ? <MediaDevices selectedDevice={selectedDevice} setSelectedDevice={setSelectedDevice} /> : null }

        <p className="header">{headerText}</p>
        
        { !isConnected ? <Button onClick={handleConnectButtonClick} name="Connect" /> : null}
        
        { isConnected && <Characters characterGroups={characterGroups} selectedCharacter={selectedCharacter} setSelectedCharacter={setSelectedCharacter} isPlaying={isPlaying} characterConfirmed={characterConfirmed} />}
        
        { isConnected && !characterConfirmed ? (
          <div className="actions">
            <Button onClick={handleTalkClick} name="Talk" disabled={!selectedCharacter} />
            <Button onClick={handleTextClick} name="Text" disabled={!selectedCharacter} />
          </div>
        ) : null}

        { isConnected && characterConfirmed ? (
        <div className="main-screen">
          { isTalkView ? 
            <CallView isRecording={isRecording} audioPlayer={audioPlayer} handleStopCall={handleStopCall} handleContinueCall={handleContinueCall} /> : 
            <TextView socket={socket} isPlaying={isPlaying} stopAudioPlayback={stopAudioPlayback} />
          }

          <div className="options-container">
            <div className="disconnect" onClick={handleDisconnect}>
              <TbPower className="icon-instance-node-small" />
            </div>
            {
              isTalkView ? (
                <div className="message" onClick={handleMessageClick}>
                  <TbMessageChatbot className="icon-instance-node-small" />
                </div>
              ) : (
                <div className="call" onClick={handleCallClick}>
                  <TbMicrophone className="icon-instance-node-small" />
                </div>
              )
            }
          </div>
        </div>
        ):null}

        <Footer />
      </div>
    </div>
  );
}

export default App;
