import { Button } from '@nextui-org/react';
import { BiMicrophone } from 'react-icons/bi';
import { BsCheckLg } from 'react-icons/bs';
import { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js/dist/wavesurfer.esm';
import RecordPlugin from 'wavesurfer.js/dist/plugins/record.esm';

// WaveSurfer hook
function useWsRecord(containerRef) {
  const [wsRecord, setWsRecord] = useState(null);
  // Initialize wavesurfer when the container mounts
  // or any of the props change
  useEffect(() => {
    if (!containerRef.current) return;
    const ws = WaveSurfer.create({
      height: 50,
      waveColor: '#6785D3',
      barWidth: 3,
      barGap: 2,
      barRadius: 4,
      container: containerRef.current,
    });
    // Initialize the Record Plugin
    const record = ws.registerPlugin(RecordPlugin.create());
    // use record plugin
    setWsRecord(record);
    return () => {
      ws.destroy();
    };
  }, [containerRef]);
  return wsRecord;
}

export default function WsRecord({ setBlob, setShowRecorder }) {
  const containerRef = useRef();
  const buttonRef = useRef();
  const [isRecording, setIsRecording] = useState(false);
  const recorder = useWsRecord(containerRef);

  function handleRecordClick() {
    if (recorder.isRecording()) {
      recorder.stopRecording();
      return;
    }
    buttonRef.current.disabled = true;
    recorder.startRecording().then(() => {
      buttonRef.current.disabled = false;
    });
  }

  useEffect(() => {
    if (!recorder) return;
    setIsRecording(false);
    const subscriptions = [
      recorder.on('record-start', () => {
        setIsRecording(true);
      }),
      recorder.on('record-end', (blob) => {
        setIsRecording(false);
        setBlob(blob);
        setShowRecorder(false);
      }),
    ];

    return () => {
      subscriptions.forEach((unsub) => unsub());
    };
  }, [recorder]);

  return (
    <div className="w-full flex flex-col items-center gap-4">
      <div
        ref={containerRef}
        className="w-full bg-transparent h-12 px-3"
      ></div>
      <Button
        ref={buttonRef}
        isIconOnly
        aria-label="recording control"
        radius="full"
        className="bg-real-blue-500"
        onPress={handleRecordClick}
      >
        {!isRecording ? (
          <BiMicrophone size="1.5em" />
        ) : (
          <BsCheckLg size="1.5em" />
        )}
      </Button>
    </div>
  );
}
