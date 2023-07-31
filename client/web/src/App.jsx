/**
 * src/App.jsx
 * 
 * created by Lynchee on 7/14/23
 */

import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import { signInWithGoogle } from './components/Auth/SignIn';

// Pages
import Settings from './pages/Settings';
import Conversation from './pages/Conversation';
import Home from './pages/Home';

// utils
import auth from './utils/firebase';

// Custom hooks
import useWebsocket from './hooks/useWebsocket';
import useMediaRecorder from './hooks/useMediaRecorder';
import useSpeechRecognition from './hooks/useSpeechRecognition'; 

const App = () => {
  const [preferredLanguage, setPreferredLanguage] = useState("English");
  const [selectedDevice, setSelectedDevice] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-3.5-turbo-16k");
  const [useSearch, setUseSearch] = useState(false);
  const [user, setUser] = useState(null);
  const isLoggedIn = useRef(false);
  const [token, setToken] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [isCallView, setIsCallView] = useState(false);
  const [textAreaValue, setTextAreaValue] = useState('');
  const [characterGroups, setCharacterGroups] = useState([]);
  const [characterConfirmed, setCharacterConfirmed] = useState(false);
  const audioPlayer = useRef(null);
  const callActive = useRef(false);
  const audioSent = useRef(false);
  const shouldPlayAudio = useRef(false);
  const audioQueue = useRef([]);
  const isConnected = useRef(false);
  const isMobile = window.innerWidth <= 768; 
  

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

  const stopAudioPlayback = () => {
    if (audioPlayer.current) {
      audioPlayer.current.pause();
      shouldPlayAudio.current = false;
    }
    audioQueue.current = [];
    setIsPlaying(false);
  }

  // Helper functions
  const handleSocketOnOpen = async (event) => {
    console.log("successfully connected");
    isConnected.current = true;
    await connectMicrophone(selectedDevice);
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

  // Use custom hooks
  const { socketRef, send, connectSocket, closeSocket } = useWebsocket(token, handleSocketOnOpen,handleSocketOnMessage, selectedModel, preferredLanguage, selectedCharacter);
  const { isRecording, connectMicrophone, startRecording, stopRecording, closeMediaRecorder } = useMediaRecorder(isConnected, audioSent, callActive, send, closeSocket);
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

  const handleStopCall = () => {
    stopRecording();
    stopListening();
    stopAudioPlayback();
    callActive.current = false;
  }

  const handleContinueCall = () => {
    startRecording();
    startListening();
    shouldPlayAudio.current = true;
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
      setCharacterGroups([]);
      setIsCallView(false);
      setTextAreaValue("");
      setSelectedModel("gpt-3.5-turbo-16k");
      setPreferredLanguage("English");

      // close web socket connection
      closeSocket();
      isConnected.current = false;
    }
  }

  return (
    <Router>
      <div className="app">
        <Header user={user} isLoggedIn={isLoggedIn} setToken={setToken} handleDisconnect={handleDisconnect} />

        <Routes>
            <Route path="/" element={
              <Home
                isMobile={isMobile}
                selectedCharacter={selectedCharacter} 
                setSelectedCharacter={setSelectedCharacter} 
                isPlaying={isPlaying}
                characterGroups={characterGroups}
                setCharacterGroups={setCharacterGroups}
                setCharacterConfirmed={setCharacterConfirmed}
                characterConfirmed={characterConfirmed}
              />} 
            />
            <Route path="/settings" element={
              <Settings 
                isMobile={isMobile}
                preferredLanguage={preferredLanguage} 
                setPreferredLanguage={setPreferredLanguage} 
                selectedDevice={selectedDevice} 
                setSelectedDevice={setSelectedDevice} 
                selectedModel={selectedModel} 
                setSelectedModel={setSelectedModel}
                useSearch={useSearch}
                setUseSearch={setUseSearch}
                send={send}
                connect={connect}
                setIsCallView={setIsCallView}
                shouldPlayAudio={shouldPlayAudio}
              />} 
            />
            <Route path="/conversation" element={
              <Conversation 
                isConnected={isConnected}
                isCallView={isCallView} 
                isRecording={isRecording} 
                isPlaying={isPlaying} 
                audioPlayer={audioPlayer} 
                handleStopCall={handleStopCall} 
                handleContinueCall={handleContinueCall} 
                audioQueue={audioQueue} 
                setIsPlaying={setIsPlaying} 
                handleDisconnect={handleDisconnect} 
                setIsCallView={setIsCallView} 
                send={send} 
                stopAudioPlayback={stopAudioPlayback} 
                textAreaValue={textAreaValue} 
                setTextAreaValue={setTextAreaValue} 
                messageInput={messageInput} 
                setMessageInput={setMessageInput} 
                useSearch={useSearch} 
                setUseSearch={setUseSearch} 
                callActive={callActive} 
                startRecording={startRecording} 
                stopRecording={stopRecording} 
                preferredLanguage={preferredLanguage} 
                setPreferredLanguage={setPreferredLanguage}
                selectedCharacter={selectedCharacter}
              />} 
            />
        </Routes>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
