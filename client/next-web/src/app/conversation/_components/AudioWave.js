import { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js/dist/wavesurfer.esm';
import RecordPlugin from 'wavesurfer.js/dist/plugins/record.esm';

// WaveSurfer hook
function useWsRecord(containerRef, options) {
  const [wsRecord, setWsRecord] = useState(null);
  // Initialize wavesurfer when the container mounts
  // or any of the props change
  useEffect(() => {
    if (!containerRef.current) return

    const ws = WaveSurfer.create({
      ...options,
      container: containerRef.current,
    })

    // Initialize the Record Plugin
    const record = ws.registerPlugin(RecordPlugin.create());

    // use record plugin
    setWsRecord(record)

    return () => {
      ws.destroy()
    }
  }, [])

  return wsRecord
}

export default function AudioWave({ isTalking }) {
  const containerRef = useRef();
  const wsRecord = useWsRecord(containerRef, {
    height: 64,
    waveColor: "#22c55e",
    barWidth: 3,
    barGap: 2,
    barRadius: 4,
  });
  useEffect(() => {
    if (!wsRecord) return;

    if (isTalking) {
      wsRecord.startMic();
    } else {
      wsRecord.stopMic();
    }
  }, [wsRecord]);

  return (
    <div ref={containerRef}></div>
  )
}
