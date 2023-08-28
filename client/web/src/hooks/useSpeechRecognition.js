/**
 * src/hooks/useSpeechRecognition.js
 * Initialize speech recognition. Start and stop listening.
 *
 * created by Lynchee on 7/16/23
 */

import { useRef, useEffect } from 'react';
import { languageCode } from './languageCode';

const useSpeechRecognition = (
  callActive,
  preferredLanguage,
  shouldPlayAudio,
  isConnected,
  audioSent,
  stopAudioPlayback,
  send,
  startRecording,
  stopRecording,
  setTextAreaValue
) => {
  const recognition = useRef(null);
  const onresultTimeout = useRef(null);
  const onspeechTimeout = useRef(null);
  const finalTranscripts = useRef([]);
  const confidence = useRef(0);

  // initialize speech recognition
  const initializeSpeechRecognition = () => {
    window.SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition.current = new window.SpeechRecognition();
    recognition.current.interimResults = true;
    recognition.current.maxAlternatives = 1;
    recognition.current.continuous = true;

    var language = languageCode[preferredLanguage];
    recognition.current.lang = language;

    recognition.current.onend = () => {
      if (callActive.current) {
        startListening();
        startRecording();
      }
    };

    recognition.current.onresult = event => {
      // Clear the timeout if a result is received
      clearTimeout(onresultTimeout.current);
      clearTimeout(onspeechTimeout.current);
      stopAudioPlayback();
      const result = event.results[event.results.length - 1];
      const transcriptObj = result[0];
      const transcript = transcriptObj.transcript;
      const ifFinal = result.isFinal;
      if (ifFinal) {
        console.log(`final transcript: {${transcript}}`);
        finalTranscripts.current.push(transcript);
        confidence.current = transcriptObj.confidence;
        send(`[&]${transcript}`);
      } else {
        console.log(`interim transcript: {${transcript}}`);
      }
      // Set a new timeout
      onresultTimeout.current = setTimeout(() => {
        if (ifFinal) {
          return;
        }
        // If the timeout is reached, send the interim transcript
        console.log(`TIMEOUT: interim transcript: {${transcript}}`);
        send(`[&]${transcript}`);
      }, 500); // 500 ms

      onspeechTimeout.current = setTimeout(() => {
        stopListening();
      }, 2000); // 2 seconds
    };

    recognition.current.onspeechend = () => {
      if (isConnected.current) {
        if (confidence.current > 0.8 && finalTranscripts.current.length > 0) {
          let message = finalTranscripts.current.join(' ');
          send(message);
          setTextAreaValue(prevState => prevState + `\nYou> ${message}\n`);
          shouldPlayAudio.current = true;
          audioSent.current = true;
        } else {
          audioSent.current = false;
        }
        stopRecording();
      }
      finalTranscripts.current = [];
    };
  };

  const startListening = () => {
    if (!recognition.current) return;
    console.log('start listening');
    recognition.current.start();
  };

  const stopListening = () => {
    if (!recognition.current) return;
    console.log('stop listening');
    recognition.current.stop();
  };

  const closeRecognition = () => {
    stopListening();
    recognition.current = null;
    confidence.current = 0;
  };

  return {
    startListening,
    stopListening,
    closeRecognition,
    initializeSpeechRecognition,
  };
};

export default useSpeechRecognition;
