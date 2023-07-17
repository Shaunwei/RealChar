// TODO: 
// break down into smaller componnets once socket can successfully connect to server!
// relace each render div parts with components, and better arrange the rendering along with booleans
// add remaining funcitonalities
// replace all icon svgs with react icons
// update style 

import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import logo from './assets/svgs/logo.svg'; 
import endCallIcon from './assets/svgs/end-call.svg'; 
import continueCallIcon from './assets/svgs/continue-call.svg'; 
import connectIcon from './assets/svgs/connect.svg'; 
import messageIcon from './assets/svgs/message.svg'; 
import microphoneIcon from './assets/svgs/microphone.svg'; 
import { FaGithub, FaDiscord, FaTwitter } from 'react-icons/fa';

import raiden from './assets/svgs/raiden.svg';
import loki from './assets/svgs/loki.svg';
import aiHelper from './assets/images/ai_helper.png';
import pi from './assets/images/pi.jpeg';
import elon from './assets/images/elon.png';
import bruce from './assets/images/elon.png';
import steve from './assets/images/jobs.png';
import realchar from './assets/svgs/realchar.svg';

const App = () => {
  // devices
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  // socket connection
  const socket = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  // characters
  const [characterConfirmed, setCharacterConfirmed] = useState(false);
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
  const [characterGroups, setCharacterGroups] = useState([]);

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

  const handleDeviceChange = (event) => {
    setSelectedDevice(event.target.value);
    connectMicrophone(event.target.value);
  };

  // socket connection
  const connectSocket = () => {
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
      sk.send("web"); // select web as the platform
    };

    sk.onmessage = (event) => {
      console.log(`receive message ${event.data}`);
      if (typeof event.data === 'string') {
        console.log("receive text data");
        const message = event.data;
        if (message === '[end]\n') {
        } else if (message.startsWith('[+]')) {
        } else if (message.startsWith('[=]')) {
        } else if (message.startsWith('Select')) {
          createCharacterGroups(message);
        } else {
        }
      } else {  // binary data
        console.log("receive binary data");
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
  };

  const handleTalkClick = () => {
    console.log("talk clicked");
    setCharacterConfirmed(true);
    setIsTalkView(true);
    setIsRecording(true);
    setCallActive(true);
  }

  const handleTextClick = () => {
    console.log("text clicked");
    setCharacterConfirmed(true);
    setIsTalkView(false);
  }

  const handleStopCall = () => {
    console.log("call stopped");
    setIsRecording(false);
    setCallActive(false);
  }

  const handleContinueCall = () => {
    console.log("call continue");
    setIsRecording(true);
    setCallActive(true);
  }

  const handleDisconnect = () => {
    console.log("disconnect");
    setIsConnected(false);
    setIsRecording(false);
    setCharacterConfirmed(false);
    setIsTalkView(false);
    setCallActive(false);
  }

  const handleMessageClick = () => {
    setIsTalkView(false);
  }

  const handleCallClick = () => {
    setIsTalkView(true);
  }

  // character groups
  const createCharacterGroups = (message) => {
    const options = message.split('\n').slice(1);

    const imageMap = {
      'Raiden Shogun And Ei': {raiden},
      'Loki': {loki},
      'Ai Character Helper': {aiHelper},
      'Reflection Pi': {pi},
      'Elon Musk': {elon},
      'Bruce Wayne': {bruce},
      'Steve Jobs': {steve},
    };

    const newCharacterGroups = [];
    options.forEach(option => {
      const match = option.match(/^(\d+)\s-\s(.+)$/);
      if (match) {
        let src = imageMap[match[2]];
        if (!src) {
          src = {realchar};
        }
        
        newCharacterGroups.push({
          id: match[1],
          name: match[2],
          imageSrc: src
        });
      }
    });

    setCharacterGroups(newCharacterGroups);
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
          <div className='radio-buttons'>
            {characterGroups.map(group => (
              <label key={group.id} className='custom-radio'>
                <input type='radio' name='radio' value={group.id} />
                <span className='radio-btn'>
                  <div className='hobbies-icon'>
                    <img src={group.imageSrc} />
                    <h4>{group.name}</h4>
                  </div>
                </span>
              </label>
            ))}
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
