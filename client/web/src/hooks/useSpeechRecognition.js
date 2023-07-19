/**
 * src/hooks/useSpeechRecognition.js
 * Initialize speech recognition. Start and stop listening.
 * 
 * created by Lynchee on 7/16/23
 */

import { useRef, useEffect } from 'react';

const useSpeechRecognition = (onResult, onend, onSpeechEnd) => {
  const recognition = useRef(null);

  const startListening = () => {
    console.log("start listening");
    recognition.current.start();
  }

  const stopListening = () => {
    console.log("stopListening");
    recognition.current.stop();
  }

  const initializeSpeechRecognition = () => {
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition.current = new window.SpeechRecognition();
    recognition.current.interimResults = true;
    recognition.current.maxAlternatives = 1;
    recognition.current.continuous = true;

    recognition.current.onstart = () => {
      console.log("Speech recognition service has started");
    };

    recognition.current.onresult = onResult;
    recognition.current.onspeechend = onSpeechEnd;
    recognition.current.onend = onend;
  };

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
