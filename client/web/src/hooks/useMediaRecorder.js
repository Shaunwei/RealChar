/**
 * src/hooks/useMediaRecorder.js
 * Initialize media recorder. Start and stop recording.
 * 
 * created by Lynchee on 7/16/23
 */

import { useState, useRef } from 'react';

const useMediaRecorder = (isConnected, audioSent, callActive, send, closeSocket) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);

  // initialize media recorder
  const connectMicrophone = (deviceId) => {
    if (mediaRecorder.current) return;
    navigator.mediaDevices.getUserMedia({
      audio: { deviceId: deviceId ? {exact: deviceId} : undefined, echoCancellation: true }
    })
    .then((stream) => {
      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.ondataavailable = (event) => {
        chunks.current.push(event.data);
      };
      mediaRecorder.current.onstop = () => {
        let blob = new Blob(chunks.current, {'type' : 'audio/webm'});
        chunks.current = [];
    
        // TODO: debug download video
    
        if (isConnected.current) {
          if (!audioSent.current) {
            send(blob);
          }
          audioSent.current = false;
          if (callActive.current) {
            startRecording();
          }
        }
      };
    })
    .catch(function(err) {
      console.log('An error occurred: ' + err);
      if (err.name === 'NotAllowedError') {
        alert("Permission Denied: Please grant permission to access the microphone and refresh the website to try again!");
      } else if (err.name === 'NotFoundError') {
        alert("No Device Found: Please check your microphone device and refresh the website to try again.");
      }
      isConnected.current = false;
      closeMediaRecorder();  
      closeSocket();
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
    chunks.current = [];
  };

  return { isRecording, setIsRecording, connectMicrophone, startRecording, stopRecording, closeMediaRecorder };
};

export default useMediaRecorder;
