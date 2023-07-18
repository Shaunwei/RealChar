import { useState, useRef, useEffect } from 'react';

const useMediaRecorder = (onDataAvailable, onStop) => {
  const [isRecording, setIsRecording] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const mediaRecorder = useRef(null);

  const connectMicrophone = (deviceId) => {
    console.log("connectMicrophone");
    if (mediaRecorder.current) return;
    navigator.mediaDevices.getUserMedia({
      audio: { deviceId: deviceId ? {exact: deviceId} : undefined, echoCancellation: true }
    })
    .then((stream) => {
      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.onstart = () => {
        console.log("recorder starts");
      }
      mediaRecorder.current.ondataavailable = onDataAvailable;
      mediaRecorder.current.onstop = onStop;
    })
    .catch(function(err) {
      console.log('An error occurred: ' + err);
    });
  };

  const startRecording = () => {
    if (!mediaRecorder.current) return;
    mediaRecorder.current.start();
    setIsRecording(true);
    setCallActive(true);
  }

  const stopRecording = () => {
    if (!mediaRecorder.current) return;
    mediaRecorder.current.stop();
    setIsRecording(false);
    setCallActive(false);
  };

  const closeMediaRecorder = () => {
    mediaRecorder.current = null;
  };

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  return { isRecording, callActive, setIsRecording, connectMicrophone, startRecording, stopRecording, closeMediaRecorder };
};

export default useMediaRecorder;
