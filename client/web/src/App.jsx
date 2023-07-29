/**
 * src/App.jsx
 * 
 * created by Lynchee on 7/14/23
 */

import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import {isIP} from 'is-ip';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import MobileWarning from './components/MobileWarning';
import MediaDevices from './components/MediaDevices';
import TextView from './components/TextView';
import CallView from './components/CallView';
import Button from './components/Common/Button';
import Characters from './components/Characters';
import { sendTokenToServer, signInWithGoogle } from './components/Auth/SignIn';
import Models from './components/Models';
import Languages from './components/Languages';

// Custom hooks
import useWebsocket from './hooks/useWebsocket';
import useMediaRecorder from './hooks/useMediaRecorder';
import useSpeechRecognition from './hooks/useSpeechRecognition'; 

// utils
import auth from './utils/firebase';

const App = () => {
  const isMobile = window.innerWidth <= 768; 
  const [headerText, setHeaderText] = useState("Choose your partner");
  const [selectedDevice, setSelectedDevice] = useState("");
  const [characterConfirmed, setCharacterConfirmed] = useState(false);
  const [isCallView, setIsCallView] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [characterGroups, setCharacterGroups] = useState([]);
  const [textAreaValue, setTextAreaValue] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [selectedModel, setSelectedModel] = useState("gpt-3.5-turbo-16k");
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [useSearch, setUseSearch] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState("English");

  const audioPlayer = useRef(null);
  const callActive = useRef(false);
  const audioSent = useRef(false);
  const shouldPlayAudio = useRef(false);
  const audioQueue = useRef([]);
  const isConnected = useRef(false);
  const isLoggedIn = useRef(false);


  useEffect(() => {
    auth.onAuthStateChanged(async user => {
      setUser(user);
      if (user) {
        isLoggedIn.current = true;
        let curToken = await auth.currentUser.getIdToken();
        setToken(curToken);
      } else {
        isLoggedIn.current = false;
      }
    })
  }, [])

  useEffect(() => {
    // Get host
    const scheme = window.location.protocol;
    var currentHost = window.location.host;
    var parts = currentHost.split(':');
    var hostname = parts[0];
    // Local deployment uses 8000 port by default.
    var newPort = '8000';

    if (!(hostname === 'localhost' || isIP(hostname))) {
        hostname = 'api.' + hostname;
        newPort = window.location.protocol === "https:" ? 443 : 80;
    }
    var newHost = hostname + ':' + newPort + '/characters';
    const url = scheme + '//' + newHost;

    // Get characters
    fetch(url)
      .then(response => response.json())
      .then(data => setCharacterGroups(data))
      .catch(err => console.error(err));
  }, [])

  // Helper functions
  const handleSocketOnOpen = (event) => {
    console.log("successfully connected");
    isConnected.current = true;
    connectMicrophone(selectedDevice);
    initializeSpeechRecognition();
  }

  const handleSocketOnMessage = (event) => {
    if (typeof event.data === 'string') {
      const message = event.data;
      if (message === '[end]\n') {
        setTextAreaValue(prevState => prevState + "\n\n");
        
      } else if (message.startsWith('[+]You said: ')) {
        // [+] indicates the transcription is done. stop playing audio
        let msg = message.split("[+]You said: ");
        setTextAreaValue(prevState => prevState + `\nYou> ${msg[1]}\n`);
        stopAudioPlayback();
      } else if (message.startsWith('[=]')) {
        // [=] indicates the response is done
        setTextAreaValue(prevState => prevState + "\n\n");
        
      } else if (message.startsWith('Select')) {
        // setCharacterGroups(createCharacterGroups(message));
      } else {
        setTextAreaValue(prevState => prevState + `${event.data}`);

        // if user interrupts the previous response, should be able to play audios of new response
        shouldPlayAudio.current = true;
      }
    } else {  // binary data
      if (!shouldPlayAudio.current) {
            console.log("should not play audio");
        return;
      }
      audioQueue.current.push(event.data);
      if (audioQueue.current.length === 1) {
        setIsPlaying(true); // this will trigger playAudios in CallView.
      }
    }
  }

  const stopAudioPlayback = () => {
    if (audioPlayer.current) {
      audioPlayer.current.pause();
      shouldPlayAudio.current = false;
    }
    audioQueue.current = [];
    setIsPlaying(false);
  }

  // Use custom hooks
  const { socketRef, send, connectSocket, closeSocket } = useWebsocket(token, handleSocketOnOpen,handleSocketOnMessage, selectedModel, preferredLanguage, selectedCharacter);
  const { isRecording, connectMicrophone, startRecording, stopRecording, closeMediaRecorder } = useMediaRecorder(isConnected, audioSent, callActive, send);
  const { startListening, stopListening, closeRecognition, initializeSpeechRecognition } = useSpeechRecognition(callActive, preferredLanguage, shouldPlayAudio, isConnected, audioSent, stopAudioPlayback, send, stopRecording, setTextAreaValue);
  
  // Handle Button Clicks
  const connect = async () => {
    try {
      // requires login if user wants to use gpt4 or claude.
      if (selectedModel !== 'gpt-3.5-turbo-16k') {
        if (isLoggedIn.current) {
          connectSocket();
        } else {
          signInWithGoogle(isLoggedIn, setToken).then(() => {
            if(isLoggedIn.current) {
              connectSocket();
            }
          });
        }
      } else {
        connectSocket();
      }
    } catch (error) {
      console.error('Error during sign in or connect:', error);
    }
  }

  const handleTalkClick = () => {
    connect();

    // Show loading animation

    const interval = setInterval(() => {
      if (isConnected.current && selectedCharacter) {
        // tell server which character the user selects
        send(selectedCharacter);
        setCharacterConfirmed(true);

        // display callview
        setIsCallView(true);
        const greeting = {
          "English": "Hi, my friend, what brings you here today?",
          "Spanish": "Hola, mi amigo, ¿qué te trae por aquí hoy?"
        }
        setHeaderText(greeting[preferredLanguage]);

        // start media recorder and speech recognition
        startRecording();
        startListening();
        shouldPlayAudio.current = true;
        callActive.current = true;

        clearInterval(interval); // Stop checking
        // Hide loading animation
      }
    }, 500); // Check every 0.5 second
  }

  const handleTextClick = () => {
    connect();

    // Show loading animation

    const interval = setInterval(() => {
      if (isConnected.current && selectedCharacter) {
        // tell server which character the user selects
        send(selectedCharacter);   
        setCharacterConfirmed(true); 

        // display textview
        setIsCallView(false);
        setHeaderText("");

        shouldPlayAudio.current = true;

        // Hide loading animation
        clearInterval(interval); // Stop checking
      }
    }, 500); // Check every 0.5 second
  }

  const handleStopCall = () => {
    stopRecording();
    stopListening();
    stopAudioPlayback();
    callActive.current = false;
  }

  const handleContinueCall = () => {
    startRecording();
    startListening();
    callActive.current = true;
  }

  const handleDisconnect = () => {
    if (socketRef && socketRef.current) {
      // stop media recorder, speech recognition and audio playing
      stopAudioPlayback();
      closeMediaRecorder();
      closeRecognition();
      callActive.current = false;
      shouldPlayAudio.current = false;
      audioSent.current = false;
      
      // reset everything to initial states
      setSelectedCharacter(null);
      setCharacterConfirmed(false);
      setIsCallView(false);
      setHeaderText("Choose your partner");
      setTextAreaValue("");
      setSelectedModel("gpt-3.5-turbo-16k");
      setPreferredLanguage("English");

      // close web socket connection
      closeSocket();
      isConnected.current = false;
    }
  }

  return (
    <div className="app">
      <Header user={user} isLoggedIn={isLoggedIn} setToken={setToken} handleDisconnect={handleDisconnect} />

      { isMobile ? (
        <MobileWarning />
      ) : (
        <div id="desktop-content">
          <p className="alert text-white">
            Please wear headphone 🎧 
            { isConnected.current && characterConfirmed && isRecording ? 
              (<span className="recording">Recording</span>) : null
            } 
          </p>

          <p className="header">{headerText}</p>

          <Characters 
              characterGroups={characterGroups} 
              selectedCharacter={selectedCharacter} 
              setSelectedCharacter={setSelectedCharacter} 
              isPlaying={isPlaying} 
              characterConfirmed={characterConfirmed} 
          />

          { !isConnected.current ? 
            <MediaDevices selectedDevice={selectedDevice} setSelectedDevice={setSelectedDevice} /> : null 
          }

          { !isConnected.current ? 
            <Models selectedModel={selectedModel} setSelectedModel={setSelectedModel} /> : null 
          }

          { !isConnected.current ? 
            <Languages preferredLanguage={preferredLanguage} setPreferredLanguage={setPreferredLanguage} /> : null 
          }

          { !isConnected.current && !characterConfirmed ? 
            ( <div className="actions">
              <Button onClick={handleTalkClick} name="Call" disabled={!selectedCharacter} />
              <Button onClick={handleTextClick} name="Text" disabled={!selectedCharacter} />
            </div> ) : null
          }

          {/* we render both views but only display one. */}
          <div style={{ display: isConnected.current && characterConfirmed ? "flex" : "none" }}>
            <div className="main-screen" style={{ display: isCallView ? "flex" : "none" }}>
              <CallView 
                isRecording={isRecording} 
                isPlaying={isPlaying}
                audioPlayer={audioPlayer} 
                handleStopCall={handleStopCall} 
                handleContinueCall={handleContinueCall}
                audioQueue={audioQueue}
                setIsPlaying={setIsPlaying}
                handleDisconnect={handleDisconnect}
                setIsCallView={setIsCallView}
              />
            </div>

            <div className="main-screen" style={{ display: isCallView ? "none" : "flex" }}>
              <TextView 
                send={send} 
                isPlaying={isPlaying}
                stopAudioPlayback={stopAudioPlayback}
                textAreaValue={textAreaValue}
                setTextAreaValue={setTextAreaValue}
                messageInput={messageInput}
                setMessageInput={setMessageInput}
                handleDisconnect={handleDisconnect}
                setIsCallView={setIsCallView}
                useSearch={useSearch}
                setUseSearch={setUseSearch}
                callActive={callActive}
                startRecording={startRecording}
                stopRecording={stopRecording}
                preferredLanguage={preferredLanguage}
                setPreferredLanguage={setPreferredLanguage}
              />
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}

export default App;
