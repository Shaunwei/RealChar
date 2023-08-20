import { useCallback, useRef } from 'react';
import hark from 'hark';

const useHark = () => {
  const speechEvents = useRef(null);
  const isSpeaking = useRef(false);
  const speakingMaxGap = 500; //in ms
  const delayedSpeakingTimeoutID = useRef(null);

  const speechEventsCallback = useCallback(
    (stream, voiceStartCallback, voiceEndCallback) => {
      speechEvents.current = hark(stream, { interval: 10 });
      speechEvents.current.on('speaking', () => {
        if (!isSpeaking.current) {
          isSpeaking.current = true;
          voiceStartCallback();
        } else {
          clearTimeout(delayedSpeakingTimeoutID.current);
        }
      });
      speechEvents.current.on('stopped_speaking', () => {
        if (isSpeaking.current) {
          delayedSpeakingTimeoutID.current = setTimeout(() => {
            voiceEndCallback();
            isSpeaking.current = false;
          }, speakingMaxGap);
        }
      });
      speechEvents.current.suspend();
    },
    []
  );
  const enableHark = () => {
    if (speechEvents.current) {
      speechEvents.current.resume();
    }
  };
  const disableHark = () => {
    if (speechEvents.current) {
      speechEvents.current.suspend();
    }
  };
  return {
    speechEventsCallback,
    enableHark,
    disableHark,
  };
};

export default useHark;
