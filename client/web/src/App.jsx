// App.js
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

// Custom hooks
import useWebsocket from './hooks/useWebsocket';
import useMediaRecorder from './hooks/useMediaRecorder';
import useSpeechRecognition from './hooks/useSpeechRecognition'; 

const App = () => {
  const [headerText, setHeaderText] = useState("");
  const [selectedDevice, setSelectedDevice] = useState("");
  const [characterConfirmed, setCharacterConfirmed] = useState(false);
  // const [isConnected, setIsConnected] = useState(false);
  const [isTalkView, setIsTalkView] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [characterGroups, setCharacterGroups] = useState([]);
  const [textAreaValue, setTextAreaValue] = useState('');
  const [messageInput, setMessageInput] = useState('');
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
  
  const [send, connectSocket, closeSocket] = useWebsocket(
    (event) => { // onopen
      console.log("successfully connected");
      // setIsConnected(true);
      isConnected.current = true;
      connectMicrophone(selectedDevice);
      initializeSpeechRecognition();
      send("web"); // select web as the platform
    },
    (event) => { // onmessage
        if (typeof event.data === 'string') {
          const message = event.data;
          if (message === '[end]\n') {
            setTextAreaValue(prevState => prevState + "\n\n");
            // chatWindow.scrollTop = chatWindow.scrollHeight;
          } else if (message.startsWith('[+]')) {
            // [+] indicates the transcription is done. stop playing audio
            setTextAreaValue(prevState => prevState + `\nYou> ${message}\n`);
            stopAudioPlayback();
          } else if (message.startsWith('[=]')) {
            // [=] indicates the response is done
            setTextAreaValue(prevState => prevState + "\n\n");
            // chatWindow.scrollTop = chatWindow.scrollHeight;
          } else if (message.startsWith('Select')) {
            setCharacterGroups(createCharacterGroups(message));
          } else {
            setTextAreaValue(prevState => prevState + `${event.data}`);
            // chatWindow.scrollTop = chatWindow.scrollHeight;

            // if user interrupts the previous response, should be able to play audios of new response
            console.log("onmessage so should play audio");
            shouldPlayAudio.current = true;
          }
        } else {  // binary data
          console.log(`received audio data. shouldPlayAudio? ${shouldPlayAudio.current}`);
          if (!shouldPlayAudio.current) {
            console.log("should not play audio");
            return;
          }
          console.log("audioQueue updated");
          audioQueue.current.push(event.data);
          if (audioQueue.current.length === 1) {
            console.log("onmessage, setIsPlaying true");
            setIsPlaying(true); // this will trigger playAudios in CallView.
          }
        }
     }
  );

  const { isRecording, connectMicrophone, startRecording, stopRecording, closeMediaRecorder } = useMediaRecorder(
    (e) => { // onDataAvailable
      console.log("onDataAvailable");
      chunks.current.push(e.data);
    },
    (e) => { // onStop
      console.log("recorder stops");
      let blob = new Blob(chunks.current, {'type' : 'audio/webm'});
      chunks.current = [];
  
      // TODO: debug download video
  
      if (isConnected.current) {
        if (!audioSent.current && callActive.current) {
          console.log("sending audio");
          send(blob);
        }
        audioSent.current = false;
        if (callActive.current) {
          console.log("onstop, start recording again when callActive");
          startRecording();
        }
      }
    }
  );

  const onResult = (event) => {
    console.log("onResult");
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

  const onSpeechEnd = () => {
    console.log("onSpeechEnd");
    if (isConnected.current) {
      audioSent.current = true;
      stopRecording();
      if (confidence.current > 0.8 && finalTranscripts.current.length > 0) {
        console.log('send final transcript');
        let message = finalTranscripts.current.join(' ');
        send(message);
        setTextAreaValue(prevState => prevState + `\nYou> ${message}\n`);
        // chatWindow.scrollTop = chatWindow.scrollHeight;
        console.log("on speech end confidence great should play audio");
        shouldPlayAudio.current = true;
      }
    }
    finalTranscripts.current = [];
  };

  const onEnd = () => {
    console.log(`recognition ends. callActive: ${callActive.current}`);
    console.log(`recognition ends. isConnected: ${isConnected.current}`);
    if (isConnected.current && callActive.current) {
      startListening();
    }
  };

  const {
    startListening,
    stopListening,
    initializeSpeechRecognition,
  } = useSpeechRecognition(onResult, onEnd, onSpeechEnd);

  const stopAudioPlayback = () => {
    if (audioPlayer.current) {
      audioPlayer.current.pause();
      console.log("stopAudioPlayback so should not play audio");
      shouldPlayAudio.current = false;
    }
    audioQueue.current = [];
    console.log("stopAudioPlayback setIsPlaying false");
    setIsPlaying(false);
  }

  const handleConnectButtonClick = () => {
    console.log("connect button clicked");
    connectSocket();
    setHeaderText("Select a character");
  };

  const handleTalkClick = () => {
    console.log("talk clicked");
    if (isConnected.current && selectedCharacter) {
      send(selectedCharacter);

      setCharacterConfirmed(true);
      setIsTalkView(true);
      
      console.log("talk button so should play audio");
      shouldPlayAudio.current = true;
      setHeaderText("Hi, my friend, what brings you here today?");

      startRecording();      
      startListening();
      console.log("setCallActive true");
      callActive.current = true;
    }
  }

  const handleTextClick = () => {
    console.log("text clicked");
    if (isConnected.current && selectedCharacter) {
      send(selectedCharacter);    

      setCharacterConfirmed(true);
      setHeaderText("");
      setTextAreaValue(prevState => prevState + "Hi, my friend, what brings you here today?\n");
      console.log("text button so should play audio");
      shouldPlayAudio.current = true;
      setIsTalkView(false);
    }
  }

  const handleStopCall = () => {
    console.log("call stopped");
    stopRecording();
    stopListening();
    stopAudioPlayback();
    console.log("setCallActive false");
    callActive.current = false;
  }

  const handleContinueCall = () => {
    console.log("call continue");
    startRecording();
    startListening();
    console.log("setCallActive true");
    callActive.current = true;
  }

  const handleDisconnect = () => {
    console.log("disconnect");
    stopAudioPlayback();
    closeSocket();
    // setIsConnected(false);
    isConnected.current = false;
    
    stopRecording();
    stopListening();
    closeMediaRecorder();
    console.log("setCallActive false");
    callActive.current = false;
    
    setCharacterConfirmed(false);
    setIsTalkView(false);
    chunks.current = []
    audioSent.current = false;
    
    setSelectedCharacter(null);
    setHeaderText("");

    setTextAreaValue("");
  }

  return (
    <div className='body'>
      <Header />
      <MobileWarning />

      <div id="desktop-content">
        <Alert text="Please wear headphone 🎧" />
        { isConnected.current && characterConfirmed && isRecording ? (<span className="recording">Recording</span>) : null}
        { !isConnected.current ? <MediaDevices selectedDevice={selectedDevice} setSelectedDevice={setSelectedDevice} /> : null }
        <p className="header">{headerText}</p>
        { !isConnected.current ? <Button onClick={handleConnectButtonClick} name="Connect" /> : null}
        { isConnected.current && <Characters characterGroups={characterGroups} selectedCharacter={selectedCharacter} setSelectedCharacter={setSelectedCharacter} isPlaying={isPlaying} characterConfirmed={characterConfirmed} />}
        { isConnected.current && !characterConfirmed ? (
          <div className="actions">
            <Button onClick={handleTalkClick} name="Talk" disabled={!selectedCharacter} />
            <Button onClick={handleTextClick} name="Text" disabled={!selectedCharacter} />
          </div>
        ) : null}

        {/* we render both views but only display one. */}
        <div style={{ display: isConnected.current && characterConfirmed ? "flex" : "none" }}>
          <div style={{ display: isTalkView ? "flex" : "none" }}>
            <CallView 
              isRecording={isRecording} 
              isPlaying={isPlaying}
              audioPlayer={audioPlayer} 
              handleStopCall={handleStopCall} 
              handleContinueCall={handleContinueCall}
              audioQueue={audioQueue}
              setIsPlaying={setIsPlaying}
              handleDisconnect={handleDisconnect}
              setIsTalkView={setIsTalkView}
            />
          </div>

          <div style={{ display: isTalkView ? "none" : "flex" }}>
            <TextView 
              send={send} 
              isPlaying={isPlaying}
              stopAudioPlayback={stopAudioPlayback}
              textAreaValue={textAreaValue}
              setTextAreaValue={setTextAreaValue}
              messageInput={messageInput}
              setMessageInput={setMessageInput}
              handleDisconnect={handleDisconnect}
              setIsTalkView={setIsTalkView}
            />
          </div>
        </div>


        <Footer />
      </div>
    </div>
  );
}

export default App;
