/**
 * src/App.jsx
 * 
 * created by Lynchee on 7/14/23
 */

import React, { useState, useRef, useEffect } from 'react';
import './App.css';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import MobileWarning from './components/MobileWarning';
import MediaDevices from './components/MediaDevices';
import TextView from './components/TextView';
import CallView from './components/CallView';
import Button from './components/Common/Button';
import { Characters, createCharacterGroups } from './components/Characters';
import { sendTokenToServer, signInWithGoogle } from './components/Auth/SignIn';
import Models from './components/Models';

// Custom hooks
import useWebsocket from './hooks/useWebsocket';
import useMediaRecorder from './hooks/useMediaRecorder';
import useSpeechRecognition from './hooks/useSpeechRecognition'; 

// utils
import auth from './utils/firebase';

const App = () => {
  const isMobile = window.innerWidth <= 768; 
  const [headerText, setHeaderText] = useState("");
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
  
  const onresultTimeout = useRef(null);
  const onspeechTimeout = useRef(null);
  const audioPlayer = useRef(null);
  const callActive = useRef(false);
  const audioSent = useRef(false);
  const shouldPlayAudio = useRef(false);
  const finalTranscripts = useRef([]);
  const audioQueue = useRef([]);
  const chunks = useRef([]);
  const confidence = useRef(0);
  const isConnected = useRef(false);
  const isLoggedIn = useRef(false);


  useEffect(() => {
    auth.onAuthStateChanged(async user => {
      setUser(user);
      if (user) {
        isLoggedIn.current = true;
        let curToken = auth.currentUser.getIdToken()
        setToken(curToken);
      } else {
        isLoggedIn.current = false;
      }
    })
  }, [])

  // Helper functions
  const handleSocketOnOpen = (event) => {
    console.log("successfully connected");
    isConnected.current = true;
    connectMicrophone(selectedDevice);
    initializeSpeechRecognition();
    send("web"); // select web as the platform
    setHeaderText("Select a character");
  }

  const handleSocketOnMessage = (event) => {
    if (typeof event.data === 'string') {
      const message = event.data;
      if (message === '[end]\n') {
        setTextAreaValue(prevState => prevState + "\n\n");
        
      } else if (message.startsWith('[+]')) {
        // [+] indicates the transcription is done. stop playing audio
        setTextAreaValue(prevState => prevState + `\nYou> ${message}\n`);
        stopAudioPlayback();
      } else if (message.startsWith('[=]')) {
        // [=] indicates the response is done
        setTextAreaValue(prevState => prevState + "\n\n");
        
      } else if (message.startsWith('Select')) {
        setCharacterGroups(createCharacterGroups(message));
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

  const handleRecorderOnDataAvailable = (event) => {
    chunks.current.push(event.data);
  }

  const handleRecorderOnStop = () => {
    let blob = new Blob(chunks.current, {'type' : 'audio/webm'});
    chunks.current = [];

    // TODO: debug download video

    if (isConnected.current) {
      if (!audioSent.current && callActive.current) {
        send(blob);
      }
      audioSent.current = false;
      if (callActive.current) {
        startRecording();
      }
    }
  }

  const handleRecognitionOnResult = (event) => {
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
      finalTranscripts.current.push(transcript);
      confidence.current = transcriptObj.confidence;
      send(`[&]${transcript}`);
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
      send(`[&]${transcript}`);
    }, 500); // 500 ms

    onspeechTimeout.current = setTimeout(() => {
      stopListening();
    }, 2000); // 2 seconds
  };

  const handleRecognitionOnSpeechEnd = () => {
    if (isConnected.current) {
      audioSent.current = true;
      stopRecording();
      if (confidence.current > 0.8 && finalTranscripts.current.length > 0) {
        let message = finalTranscripts.current.join(' ');
        send(message);
        setTextAreaValue(prevState => prevState + `\nYou> ${message}\n`);
        
        shouldPlayAudio.current = true;
      }
    }
    finalTranscripts.current = [];
  };

  const stopAudioPlayback = () => {
    if (audioPlayer.current) {
      audioPlayer.current.pause();
      shouldPlayAudio.current = false;
    }
    audioQueue.current = [];
    setIsPlaying(false);
  }

  // Use custom hooks
  const { socketRef, send, connectSocket, closeSocket } = useWebsocket(token, handleSocketOnOpen,handleSocketOnMessage, selectedModel);
  const { isRecording, connectMicrophone, startRecording, stopRecording, closeMediaRecorder } = useMediaRecorder(handleRecorderOnDataAvailable, handleRecorderOnStop);
  const { startListening, stopListening, closeRecognition, initializeSpeechRecognition } = useSpeechRecognition(handleRecognitionOnResult, handleRecognitionOnSpeechEnd, callActive);
  
  // Handle Button Clicks
  const handleConnectButtonClick = async () => {
    try {
      // requires login if user wants to use gpt4 or claude.
      if (selectedModel !== 'gpt-3.5-turbo-16k') {
        if (isLoggedIn.current) {
          await sendTokenToServer(token);
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
    if (isConnected.current && selectedCharacter) {
      // tell server which character the user selects
      send(selectedCharacter);
      setCharacterConfirmed(true);

      // display callview
      setIsCallView(true);
      setHeaderText("Hi, my friend, what brings you here today?");

      // start media recorder and speech recognition
      startRecording();      
      startListening();
      shouldPlayAudio.current = true;
      callActive.current = true;
    }
  }

  const handleTextClick = () => {
    if (isConnected.current && selectedCharacter) {
      // tell server which character the user selects
      send(selectedCharacter);   
      setCharacterConfirmed(true); 

      // display textview
      setIsCallView(false);
      setHeaderText("");

      shouldPlayAudio.current = true;
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
      confidence.current = 0;
      chunks.current = []
      
      // reset everything to initial states
      setSelectedCharacter(null);
      setCharacterConfirmed(false);
      setIsCallView(false);
      setHeaderText("");
      setTextAreaValue("");
      setSelectedModel("gpt-3.5-turbo-16k");

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

          { !isConnected.current ? 
            <MediaDevices selectedDevice={selectedDevice} setSelectedDevice={setSelectedDevice} /> : null 
          }

          { !isConnected.current ? 
            <Models selectedModel={selectedModel} setSelectedModel={setSelectedModel} /> : null 
          }

          <p className="header">{headerText}</p>

          { !isConnected.current ? 
            <Button onClick={handleConnectButtonClick} name="Connect" /> : null
          }

          { isConnected.current && 
            <Characters 
              characterGroups={characterGroups} 
              selectedCharacter={selectedCharacter} 
              setSelectedCharacter={setSelectedCharacter} 
              isPlaying={isPlaying} 
              characterConfirmed={characterConfirmed} 
            />
          }

          { isConnected.current && !characterConfirmed ? 
            ( <div className="actions">
              <Button onClick={handleTalkClick} name="Talk" disabled={!selectedCharacter} />
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
