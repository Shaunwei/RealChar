import React, { useState, useEffect, useRef } from 'react';
import { TbMessageChatbot, TbPower, TbMicrophone } from 'react-icons/tb';
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

// utils
import { playAudios } from './utils/audioUtils';

const App = () => {
  const chunks = useRef([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [characterConfirmed, setCharacterConfirmed] = useState(false);
  const [audioSent, setAudioSent] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [characterGroups, setCharacterGroups] = useState([]);
  const [isTalkView, setIsTalkView] = useState(false);
  const [headerText, setHeaderText] = useState("");
  const onresultTimeout = useRef(null);
  const onspeechTimeout = useRef(null);
  const [confidence, setConfidence] = useState(0);
  const [finalTranscripts, setFinalTranscripts] = useState([]);
  const [shouldPlayAudio, setShouldPlayAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioQueue, setAudioQueue] = useState([]);
  const audioPlayer = useRef(null);
  const audioContextRef = useRef(null);

  const [send, connectSocket, closeSocket] = useWebsocket(
    (event) => { // onopen
      console.log("successfully connected");
      setIsConnected(true);
      connectMicrophone(selectedDevice);
      initializeSpeechRecognition();
      send("web"); // select web as the platform
    },
    (event) => { // onmessage
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
            playAudios(audioContextRef, audioPlayer, audioQueue, setAudioQueue, setIsPlaying);
          }
        }
     }
  );

  const { isRecording, callActive, connectMicrophone, startRecording, stopRecording, closeMediaRecorder } = useMediaRecorder(
    (e) => { // onDataAvailable
      chunks.current.push(e.data);
    },
    (e) => { // onStop
      console.log("recorder stops");
      let blob = new Blob(chunks.current, {'type' : 'audio/webm'});
      chunks.current = [];
  
      // TODO: debug download video
  
      if (isConnected) {
        if (!audioSent && callActive) {
          console.log("sending audio");
          send(blob);
        }
        setAudioSent(false);
        if (callActive) {
          startRecording();
        }
      }
    }
  );

  const onResult = (event) => {
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
    console.log('speech ends');
    if (isConnected) {
      setAudioSent(true);
      stopRecording();
      if (confidence > 0.8 && finalTranscripts.length > 0) {
        console.log('send final transcript');
        let message = finalTranscripts.join(' ');
        send(message);
        // chatWindow.value += `\nYou> ${message}\n`;
        // chatWindow.scrollTop = chatWindow.scrollHeight;
        console.log("on speech end confidence great should play audio");
        setShouldPlayAudio(true);
      }
    }
    setFinalTranscripts([]);
  };

  const onEnd = () => {
    console.log('recognition ends');
    if (isConnected && callActive) {
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
      setShouldPlayAudio(false);
    }
    setAudioQueue([]);
    setIsPlaying(false);
  }

  const handleConnectButtonClick = () => {
    console.log("connect button clicked");
    connectSocket();
    setHeaderText("Select a character");
  };

  const handleTalkClick = () => {
    console.log("talk clicked");
    if (isConnected && selectedCharacter) {
      send(selectedCharacter);

      setCharacterConfirmed(true);
      setIsTalkView(true);
      
      console.log("talk button so should play audio");
      setShouldPlayAudio(true);
      setHeaderText("Hi, my friend, what brings you here today?");

      startRecording();      
      startListening();
      
      
    }
  }

  const handleTextClick = () => {
    console.log("text clicked");
    if (isConnected && selectedCharacter) {
      send(selectedCharacter);    

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
    stopRecording();
    stopListening();
    stopAudioPlayback();
  }

  const handleContinueCall = () => {
    console.log("call continue");
    startRecording();
    startListening();
  }

  const handleDisconnect = () => {
    console.log("disconnect");
    stopAudioPlayback();
    closeSocket();
    setIsConnected(false);
    
    stopRecording();
    stopListening();
    closeMediaRecorder();
    
    setCharacterConfirmed(false);
    setIsTalkView(false);
    chunks.current = []
    setAudioSent(false);
    
    setSelectedCharacter(null);
    setHeaderText("");
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
              <TextView send={send} isPlaying={isPlaying} stopAudioPlayback={stopAudioPlayback} />
            }

            <div className="options-container">
              <div className="disconnect" onClick={handleDisconnect}>
                <TbPower className="icon-instance-node-small" />
              </div>
              {
                isTalkView ? (
                  <div className="message" onClick={() => setIsTalkView(false)}>
                    <TbMessageChatbot className="icon-instance-node-small" />
                  </div>
                ) : (
                  <div className="call" onClick={() => setIsTalkView(true)}>
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
