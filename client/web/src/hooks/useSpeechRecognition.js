// hooks/useSpeechRecognition.js
import { useState, useEffect, useRef } from 'react';

const useSpeechRecognition = (onResult, onend, onSpeechEnd) => {
  const [isListening, setIsListening] = useState(false);
  const recognition = useRef(null);

  const startListening = () => {
    console.log("startListening");
    setIsListening(true);
  }

  const stopListening = () => {
    console.log("stopListening");
    setIsListening(false);
  }
  const initializeSpeechRecognition = () => {
    console.log("initializeSpeechRecognition");
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

  useEffect(() => {
    if (!recognition.current) return;
    if (isListening) {
      recognition.current.start();
    } else if (recognition.current) {
      recognition.current.stop();
    }
  }, [isListening]);

  return {
    startListening,
    stopListening,
    initializeSpeechRecognition,
  };
};

export default useSpeechRecognition;
