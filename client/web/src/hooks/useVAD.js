import { useCallback, useRef } from "react";
import hark from 'hark';

const useHark = () => {
    const speechEvents = useRef(null);
    const speechEventsCallback = useCallback((stream, voiceStartCallback, voiceEndCallback) => {
        speechEvents.current = hark(stream, {});
        speechEvents.current.on('speaking', () => {
            voiceStartCallback();
        });
        speechEvents.current.on('stopped_speaking', () => {
            voiceEndCallback();
        });
    }
        , []);
    const enableHark = () => {
        if (speechEvents.current) {
            speechEvents.current.resume();
        }
    }
    const disableHark = () => {
        if (speechEvents.current) {
            speechEvents.current.suspend();
        }
    }
    return {
        speechEventsCallback,
        enableHark,
        disableHark
    }
}

export default useHark;