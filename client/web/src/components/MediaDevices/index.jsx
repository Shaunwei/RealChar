/**
 * src/components/MediaDevices/index.jsx
 * generate a list of media devices.
 *
 * created by Lynchee on 7/16/23
 */

import React, { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

const MediaDevices = ({ selectedDevice, setSelectedDevice }) => {
  const [devices, setDevices] = useState([]);

  // get media devices from browser.
  useEffect(() => {
    navigator.mediaDevices
      .enumerateDevices()
      .then(devices => {
        const audioInputDevices = devices.filter(
          device => device.kind === 'audioinput'
        );

        if (audioInputDevices.length === 0) {
          console.log('No audio input devices found');
        } else {
          setDevices(audioInputDevices);
        }
      })
      .catch(err => console.log('An error occurred: ' + err));
  }, [selectedDevice]);

  const handleDeviceChange = value => {
    setSelectedDevice(value);
  };
  return (
    <div className='space-y-2'>
      <label>Microphone</label>
      <Select
        value={selectedDevice}
        onValueChange={handleDeviceChange}
        id='audio-device-selection'
        className='select'
      >
        <SelectTrigger>
          <SelectValue placeholder='Select a Microphone' />
        </SelectTrigger>
        <SelectContent>
          {devices.map((device, index) => (
            <SelectItem key={device.deviceId} value={device.deviceId}>
              {device.label || `Microphone ${index + 1}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default MediaDevices;
