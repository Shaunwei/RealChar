/**
 * src/hooks/useSpeechRecognition.js
 * Initialize speech recognition. Start and stop listening.
 * 
 * created by Lynchee on 7/16/23
 */

import { useRef, useEffect } from 'react';

const useSpeechRecognition = (onResult, onSpeechEnd, callActive) => {
  const recognition = useRef(null);

  // initialize speech recognition
  const initializeSpeechRecognition = () => {
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition.current = new window.SpeechRecognition();
    recognition.current.interimResults = true;
    recognition.current.maxAlternatives = 1;
    recognition.current.continuous = true;

    recognition.current.onend = () => {
      if (callActive.current) {
        startListening();
      }
    };

    recognition.current.onresult = onResult;
    recognition.current.onspeechend = onSpeechEnd;
  };

  const startListening = () => {
    if (!recognition.current) return;
    console.log("start listening");
    recognition.current.start();
  }

  const stopListening = () => {
    if (!recognition.current) return;
    console.log("stop listening");
    recognition.current.stop();
  }

  const closeRecognition = () => {
    stopListening();
    recognition.current = null;
  }

  return {
    startListening,
    stopListening,
    closeRecognition,
    initializeSpeechRecognition,
  };
};

export default useSpeechRecognition;
