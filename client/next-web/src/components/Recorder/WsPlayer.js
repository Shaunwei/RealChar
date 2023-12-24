import { Button } from '@nextui-org/react';
import { BsPlayFill, BsPauseFill } from 'react-icons/bs';
import WaveSurfer from 'wavesurfer.js/dist/wavesurfer.esm';
import { useState, useRef, useEffect } from 'react';

// WaveSurfer hook
function useWs(containerRef, recordedUrl) {
  const [wavesurfer, setWavesurfer] = useState(null);
  // Initialize wavesurfer when the container mounts
  // or any of the props change
  useEffect(() => {
    if (!containerRef.current) return;
    const ws = WaveSurfer.create({
      height: 50,
      waveColor: '#6785D3',
      progressColor: '#636A84',
      barWidth: 3,
      barGap: 2,
      barRadius: 4,
      url: recordedUrl,
      container: containerRef.current,
    });
    setWavesurfer(ws);
    return () => {
      ws.destroy();
    };
  }, [containerRef]);
  return wavesurfer;
}

export default function WsPlayer({ blob, handleRetry, handleConfirm }) {
  const containerRef = useRef();
  const [isPlaying, setIsPlaying] = useState(false);
  const recordedUrl = URL.createObjectURL(blob);
  const ws = useWs(containerRef, recordedUrl);

  function handlePlayPause() {
    ws.playPause();
  }

  function handleUpload() {
    const file = new File([blob], 'recording.wav');
    handleConfirm(file);
  }

  useEffect(() => {
    if (!ws) return;
    setIsPlaying(false);
    const subscriptions = [
      ws.on('play', () => setIsPlaying(true)),
      ws.on('pause', () => setIsPlaying(false)),
    ];
    return () => {
      subscriptions.forEach((unsub) => unsub());
    };
  }, [ws]);

  return (
    <div className="w-full flex flex-col gap-4">
      <div
        ref={containerRef}
        className="w-full bg-transparent h-12 px-3"
      ></div>
      <div className="flex flex-row gap-2 justify-between">
        <Button onPress={handleRetry}>Retry</Button>
        <Button
          isIconOnly
          aria-label="play control"
          radius="full"
          onPress={handlePlayPause}
          className="bg-real-blue-500"
        >
          {!isPlaying ? (
            <BsPlayFill size="1.5em" />
          ) : (
            <BsPauseFill size="1.5em" />
          )}
        </Button>
        <Button
          onPress={handleUpload}
          className="bg-real-contrastBlue"
        >
          Done
        </Button>
      </div>
    </div>
  );
}
