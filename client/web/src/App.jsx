/**
 * src/App.jsx
 *
 * created by Lynchee on 7/14/23
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import { signInWithGoogle } from './components/Auth/SignIn';

// Pages
import Settings from './pages/Settings';
import Conversation from './pages/Conversation';
import SharedConversation from './pages/SharedConversation';
import Home from './pages/Home';
import CharCreate from './pages/CharCreate';
import CharDelete from './pages/CharDelete';

// utils
import auth from './utils/firebase';

// Custom hooks
import useWebsocket from './hooks/useWebsocket';
import useMediaRecorder from './hooks/useMediaRecorder';
import useSpeechRecognition from './hooks/useSpeechRecognition';

const App = () => {
  const [sessionId, setSessionId] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo-16k');
  const [useSearch, setUseSearch] = useState(false);
  const [useQuivr, setUseQuivr] = useState(false);
  const [quivrApiKey, setQuivrApiKey] = useState('');
  const [quivrBrainId, setQuivrBrainId] = useState('');
  const [user, setUser] = useState(null);
  const isLoggedIn = useRef(false);
  const [token, setToken] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [isCallView, setIsCallView] = useState(false);
  const [textAreaValue, setTextAreaValue] = useState('');
  const [isTextStreaming, setIsTextStreaming] = useState(false);
  const [characterGroups, setCharacterGroups] = useState([]);
  const [characterConfirmed, setCharacterConfirmed] = useState(false);
  const [messageId, setMessageId] = useState('');
  const audioPlayer = useRef(null);
  const callActive = useRef(false);
  const audioSent = useRef(false);
  const shouldPlayAudio = useRef(false);
  const audioQueue = useRef([]);
  const isConnecting = useRef(false);
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
    });
  }, []);

  const stopAudioPlayback = () => {
    if (audioPlayer.current) {
      audioPlayer.current.pause();
      shouldPlayAudio.current = false;
    }
    audioQueue.current = [];
    setIsPlaying(false);
  };

  // Helper functions
  const handleSocketOnOpen = async event => {
    console.log('successfully connected');
    isConnected.current = true;
    await connectMicrophone(selectedDevice);
    initializeSpeechRecognition();
  };

  const handleSocketOnMessage = event => {
    if (typeof event.data === 'string') {
      const message = event.data;
      if (!isTextStreaming) setIsTextStreaming(true);
      if (message === '[end]\n' || message.match(/\[end=([a-zA-Z0-9]+)\]/)) {
        setIsTextStreaming(false);
        setIsResponding(false);
        setTextAreaValue(prevState => prevState + '\n\n');
        const messageIdMatches = message.match(/\[end=([a-zA-Z0-9]+)\]/);
        if (messageIdMatches) {
          const messageId = messageIdMatches[1];
          setMessageId(messageId);
        }
      } else if (message === '[thinking]\n') {
        setIsThinking(true);
      } else if (message.startsWith('[+]You said: ')) {
        // [+] indicates the transcription is done. stop playing audio
        let msg = message.split('[+]You said: ');
        setTextAreaValue(prevState => prevState + `\nYou> ${msg[1]}\n`);
        stopAudioPlayback();
      } else if (
        message.startsWith('[=]' || message.match(/\[=([a-zA-Z0-9]+)\]/))
      ) {
        // [=] or [=id] indicates the response is done
        setTextAreaValue(prevState => prevState + '\n\n');
      } else {
        setIsThinking(false);
        setIsResponding(true);
        setTextAreaValue(prevState => prevState + `${event.data}`);

        // if user interrupts the previous response, should be able to play audios of new response
        shouldPlayAudio.current = true;
      }
    } else {
      // binary data
      if (!shouldPlayAudio.current) {
        console.log('should not play audio');
        return;
      }
      audioQueue.current.push(event.data);
      if (audioQueue.current.length === 1) {
        setIsPlaying(true); // this will trigger playAudios in CallView.
      }
    }
  };

  // Use custom hooks
  const { socketRef, send, connectSocket, closeSocket } = useWebsocket(
    token,
    handleSocketOnOpen,
    handleSocketOnMessage,
    selectedModel,
    preferredLanguage,
    useSearch,
    useQuivr,
    selectedCharacter,
    setSessionId
  );
  const {
    isRecording,
    connectMicrophone,
    startRecording,
    stopRecording,
    closeMediaRecorder,
  } = useMediaRecorder(isConnected, audioSent, callActive, send, closeSocket);
  const {
    startListening,
    stopListening,
    closeRecognition,
    initializeSpeechRecognition,
  } = useSpeechRecognition(
    callActive,
    preferredLanguage,
    shouldPlayAudio,
    isConnected,
    audioSent,
    stopAudioPlayback,
    send,
    stopRecording,
    setTextAreaValue
  );

  const connectSocketWithState = useCallback(() => {
    isConnecting.current = true;
    connectSocket();
    isConnecting.current = false;
  }, [isConnecting, connectSocket]);

  const closeSocketWithState = () => {
    closeSocket();
  };

  // Handle Button Clicks
  const connect = async () => {
    try {
      // requires login if user wants to use gpt4 or claude.
      if (selectedModel !== 'gpt-3.5-turbo-16k') {
        if (isLoggedIn.current) {
          connectSocketWithState();
        } else {
          signInWithGoogle(isLoggedIn, setToken).then(() => {
            if (isLoggedIn.current) {
              connectSocketWithState();
            }
          });
        }
      } else {
        connectSocketWithState();
      }
    } catch (error) {
      console.error('Error during sign in or connect:', error);
    }
  };

  const handleStopCall = () => {
    stopRecording();
    stopListening();
    stopAudioPlayback();
    callActive.current = false;
  };

  const handleContinueCall = () => {
    startRecording();
    startListening();
    shouldPlayAudio.current = true;
    callActive.current = true;
  };

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
      setTextAreaValue('');
      setSelectedModel('gpt-3.5-turbo-16k');
      setPreferredLanguage('English');

      // close web socket connection
      closeSocketWithState();
      isConnected.current = false;
    }
  };

  return (
    <Router>
      <div className='app'>
        <Header
          user={user}
          isLoggedIn={isLoggedIn}
          setToken={setToken}
          handleDisconnect={handleDisconnect}
        />

        <Routes>
          <Route
            path='/'
            element={
              <Home
                isMobile={isMobile}
                selectedCharacter={selectedCharacter}
                setSelectedCharacter={setSelectedCharacter}
                isPlaying={isPlaying}
                characterGroups={characterGroups}
                setCharacterGroups={setCharacterGroups}
                setCharacterConfirmed={setCharacterConfirmed}
                characterConfirmed={characterConfirmed}
                token={token}
                setToken={setToken}
                isLoggedIn={isLoggedIn}
              />
            }
          />
          <Route
            path='/settings'
            element={
              <Settings
                setSelectedCharacter={setSelectedCharacter}
                isMobile={isMobile}
                preferredLanguage={preferredLanguage}
                setPreferredLanguage={setPreferredLanguage}
                selectedDevice={selectedDevice}
                setSelectedDevice={setSelectedDevice}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                isLoggedIn={isLoggedIn}
                token={token}
                setToken={setToken}
                useSearch={useSearch}
                setUseSearch={setUseSearch}
                useQuivr={useQuivr}
                setUseQuivr={setUseQuivr}
                quivrApiKey={quivrApiKey}
                setQuivrApiKey={setQuivrApiKey}
                quivrBrainId={quivrBrainId}
                setQuivrBrainId={setQuivrBrainId}
                send={send}
                connect={connect}
                setIsCallView={setIsCallView}
                shouldPlayAudio={shouldPlayAudio}
              />
            }
          />
          <Route
            path='/conversation'
            element={
              <Conversation
                isConnecting={isConnecting}
                isConnected={isConnected}
                isCallView={isCallView}
                isRecording={isRecording}
                isPlaying={isPlaying}
                isThinking={isThinking}
                isResponding={isResponding}
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
                setSelectedCharacter={setSelectedCharacter}
                setSelectedModel={setSelectedModel}
                setSelectedDevice={setSelectedDevice}
                connect={connect}
                messageId={messageId}
                token={token}
                isTextStreaming={isTextStreaming}
                sessionId={sessionId}
              />
            }
          />
          <Route path='/shared' element={<SharedConversation />} />
          <Route path='/create' element={<CharCreate token={token} />} />
          <Route
            path='/delete'
            element={
              <CharDelete
                token={token}
                isMobile={isMobile}
                characterGroups={characterGroups}
              />
            }
          />
        </Routes>

        <Footer />
      </div>
    </Router>
  );
};

export default App;
