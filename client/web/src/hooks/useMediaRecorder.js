/**
 * src/hooks/useMediaRecorder.js
 * Initialize media recorder. Start and stop recording.
 * 
 * created by Lynchee on 7/16/23
 */

import { useState, useRef } from 'react';

const useMediaRecorder = (onDataAvailable, onStop) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef(null);

  // initialize media recorder
  const connectMicrophone = (deviceId) => {
    if (mediaRecorder.current) return;
    navigator.mediaDevices.getUserMedia({
      audio: { deviceId: deviceId ? {exact: deviceId} : undefined, echoCancellation: true }
    })
    .then((stream) => {
      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.ondataavailable = onDataAvailable;
      mediaRecorder.current.onstop = onStop;
    })
    .catch(function(err) {
      console.log('An error occurred: ' + err);
    });
  };

  const startRecording = () => {
    console.log("start recording");
    if (!mediaRecorder.current) return;
    mediaRecorder.current.start();
    setIsRecording(true);
  }

  const stopRecording = () => {
    console.log("stop recording");
    if (!mediaRecorder.current) return;
    mediaRecorder.current.stop();
    setIsRecording(false);
  };

  const closeMediaRecorder = () => {
    stopRecording();
    mediaRecorder.current = null;
  };

  return { isRecording, setIsRecording, connectMicrophone, startRecording, stopRecording, closeMediaRecorder };
};

export default useMediaRecorder;
