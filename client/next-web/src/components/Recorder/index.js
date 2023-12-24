import { useState, useEffect } from 'react';
import WsRecord from './WsRecord';
import WsPlayer from './WsPlayer';

export default function Recorder({ handleConfirm }) {
  const [blob, setBlob] = useState(null);
  const [showRecorder, setShowRecorder] = useState(true);

  function handleRetry() {
    setShowRecorder(true);
  }

  useEffect(() => {
    setShowRecorder(true);
  }, []);

  return (
    <>
      {showRecorder ? (
        <WsRecord
          setBlob={setBlob}
          setShowRecorder={setShowRecorder}
        />
      ) : (
        <WsPlayer
          blob={blob}
          handleRetry={handleRetry}
          handleConfirm={handleConfirm}
        />
      )}
    </>
  );
}
