/**
 * src/components/MediaDevices/index.jsx
 * generate a list of media devices.
 * 
 * created by Lynchee on 7/16/23
 */

import React, { useEffect, useState } from 'react';
import './style.css';

const MediaDevices = ({ selectedDevice, setSelectedDevice }) => {
  const [devices, setDevices] = useState([]);

  // get media devices from browser.
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

  const handleDeviceChange = (event) => {
    setSelectedDevice(event.target.value);
  };

  return (
    <div className="devices-container">
      <label>Microphone</label>
      <select
          id="audio-device-selection"
          value={selectedDevice} 
          onChange={handleDeviceChange}
          className="select"
      >
          {devices.map((device, index) => (
            <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${index + 1}`}
            </option>
          ))}
      </select>
    </div>
  );
}

export default MediaDevices;
