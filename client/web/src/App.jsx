import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import logo from './assets/svgs/logo.svg'; 
import endCallIcon from './assets/svgs/end-call.svg'; 
import continueCallIcon from './assets/svgs/continue-call.svg'; 
import connectIcon from './assets/svgs/connect.svg'; 
import messageIcon from './assets/svgs/message.svg'; 
import microphoneIcon from './assets/svgs/microphone.svg'; 
import { FaGithub, FaDiscord, FaTwitter } from 'react-icons/fa';

const App = () => {
  // devices
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  // socket connection
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  // characters
  const [characterConfirmed, setCharacterConfirmed] = useState(false);
  // Talk
  const [isTalkView, setIsTalkView] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // render devices
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const audioInputDevices = devices.filter(device => device.kind === 'audioinput');
        
        if (audioInputDevices.length === 0) {
          console.log('No audio input devices found');
        } else {
          setDevices(audioInputDevices);
        }
      })
      .catch(err => console.log('An error occurred: ' + err));
  }, []);

  const connectMicrophone = (deviceId) => {
    // logic to connect the microphone
    console.log("connectMicrophone");
  }

  const handleDeviceChange = (event) => {
    setSelectedDevice(event.target.value);
    connectMicrophone(event.target.value);
  };

  // socket connection
  const connectSocket = () => {
    const clientId = Math.floor(Math.random() * 1010000);
    const ws_scheme = window.location.protocol === "https:" ? "wss" : "ws";
    const ws_path = ws_scheme + '://' + window.location.host + `/ws/${clientId}`;
    console.log(`ws_path ${ws_path}`);

    let socket = new WebSocket(ws_path);
    socket.binaryType = 'arraybuffer';

    socket.onopen = (event) => {
      console.log("successfully connected");
      setIsConnected(true);
      connectMicrophone(selectedDevice);
      socket.send("web"); // select web as the platform
    };

    socket.onmessage = (event) => {
      console.log(`receive message ${event.data}`);
    };

    socket.onerror = (error) => {
      console.log(`WebSocket Error: ${error}`);
    };

    socket.onclose = (event) => {
      console.log("Socket closed");
    };

    socketRef.current = socket;
    setIsConnected(true);
  };

  const handleConnectButtonClick = () => {
    console.log("connect button clicked");
    connectSocket();
  };

  const handleTalkClick = () => {
    console.log("talk clicked");
    setCharacterConfirmed(true);
    setIsTalkView(true);
    setIsRecording(true);
  }

  const handleTextClick = () => {
    console.log("text clicked");
    setCharacterConfirmed(true);
    setIsTalkView(false);
  }

  const handleStopCall = () => {
    console.log("call stopped");
    setIsRecording(false);
  }

  const handleContinueCall = () => {
    console.log("call continue");
    setIsRecording(true);
  }

  const handleDisconnect = () => {
    console.log("disconnect");
    setIsConnected(false);
    setIsRecording(false);
    setCharacterConfirmed(false);
    setIsTalkView(false);
  }

  const handleMessageClick = () => {
    setIsTalkView(false);
  }

  const handleCallClick = () => {
    setIsTalkView(true);
  }


  return (
    <div className='body'>
      <div className="logo-container">
        <img alt="Logo" src={logo} />
      </div>

      <div id="mobile-warning">
        <p>This website is best viewed on a desktop browser.</p>
        <p>Please switch to a desktop for the best experience.</p>
        <p>Mobile version is coming soon!</p>
      </div>

      <div id="desktop-content">
        <p className="alert"> Please wear headphone 🎧 
          { isConnected && characterConfirmed && isRecording ? (
            <span id="recording" className="recording">Recording</span> 
          ) : null}
        </p>

        { !isConnected ? (
        <div id="devices-container" className="devices-container">
          <label className="audio-device-label" htmlFor="audio-device-selection">Select an audio input device:</label>
          <div className="select-dropdown">
            <select 
              id="audio-device-selection" 
              className="form-select" 
              value={selectedDevice} 
              onChange={handleDeviceChange}
            >
              {devices.map((device, index) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${index + 1}`}
                </option>
              ))}
            </select>
          </div>
        </div>):null}

        <div className="header">
          <p></p>
        </div>

        { !isConnected ? (
          <button id="connect" className="connect" onClick={handleConnectButtonClick}>Connect</button>
        ) : null}

        <div className="main-container">
          <div className="radio-buttons">
          </div>
        </div>

        { isConnected && !characterConfirmed ? (
           <div className="actions">
           <button id="talk-btn" className="talk-btn" onClick={handleTalkClick} >Talk</button>
           <button id="text-btn" className="text-btn" onClick={handleTextClick} >Text</button>
         </div>
        ) : null}
       
       
        { isConnected && characterConfirmed ? (
        <div className="main-screen">
          {isTalkView && isRecording ?  (
            <div id="player-container" className="player-container">
            <div id="sound-wave" className="sound-wave">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>

            <audio id="audio-player" className="audio-player">
              <source src="" type="audio/mp3" />
            </audio>
          </div>
          ):(
            <textarea id="chat-window" className="chat-window" readOnly draggable="false"></textarea>
          )}
          

          <div className="action-container">
            { isTalkView ? (
               isRecording ? (
                <div id="stop-call" className="stop-call" onClick={handleStopCall}>
                  <img src={endCallIcon} alt="End call icon" className="icon-instance-node"/>
                </div>
               ) : (
                <div id="continue-call" className="continue-call" onClick={handleContinueCall}>
                  <img src={continueCallIcon} alt="Continue call icon" className="icon-instance-node"/>
                </div>
               )
            ) : (
              <>
              <div className="message-input-container">
                <input id="message-input" className="message-input" type="text" placeholder="Type your message"/>
                <span className="focus-border">
                  <i></i>
                </span>
              </div>
              <button id="send-btn" className="send-btn">Send Message</button>
              </>
            )}
          </div>

          <div className="options-container">
            <div id="disconnect" className="disconnect" onClick={handleDisconnect}>
              <img src={connectIcon} alt="Connect Icon" className="icon-instance-node-small" />
            </div>
            {
              isTalkView ? (
                <div id="message" className="message" onClick={handleMessageClick}>
                  <img src={messageIcon} alt="Message Icon" className="icon-instance-node-small" />
                </div>
              ) : (
                <div id="call" className="call" onClick={handleCallClick}>
                  <img src={microphoneIcon} alt="Microphone Icon" className="icon-instance-node-small" />
                </div>
              )
            }
          </div>
        </div>
        ):null}

        <footer>
          <div className="rounded-social-buttons">
            <a className="social-button github" href="https://github.com/Shaunwei/RealChar" target="_blank" rel="noreferrer"><FaGithub /></a>
            <a className="social-button discord" href="https://discord.gg/e4AYNnFg2F" target="_blank" rel="noreferrer"><FaDiscord /></a>
            <a className="social-button twitter" href="https://twitter.com/agishaun" target="_blank" rel="noreferrer"><FaTwitter /></a>
          </div>
          <p className="copyright">Copyright © 2023 RealChar. All rights reserved. Any AI character's statements are fictional and don't represent actual beliefs or opinions.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
