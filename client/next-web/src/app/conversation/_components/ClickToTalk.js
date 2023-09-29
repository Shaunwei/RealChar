import { Button } from '@nextui-org/react';
import Image from 'next/image';
import micSvg from '@/assets/svgs/microphone.svg';
import pauseSvg from '@/assets/svgs/pause.svg';
import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import AudioWave from './AudioWave'

export default function ClickToTalk({
  className
}) {
  const [ isTalking, setIsTalking ] = useState(false);
  const { startRecording, stopRecording } = useAppStore();

  function startTalk() {
    setIsTalking(true);
    startRecording();
  }

  function stopTalk() {
    setIsTalking(false);
    stopRecording();
  }

  return (
    <>
    {!isTalking ? (
      <div className={className}>
        <p className="font-light text-tiny absolute bottom-0 -ml-8">Click and start talking</p>
        <Button
          isIconOnly
          size="lg"
          radius="full"
          className="bg-real-navy w-16 h-16 mb-4"
          onPress={startTalk}
        >
          <Image
            priority
            src={micSvg}
            alt="microphone button"
            className="w-5"
          />
        </Button>
      </div>
    ) : (
      <div className={className + ' mb-4'}>
        <p className="font-light text-tiny absolute top-0 -ml-8">Click to send message</p>
        <span className="animate-ping absolute w-16 h-16 bg-real-navy opacity-50 rounded-full"></span>
        <Button
          isIconOnly
          radius="full"
          size="lg"
          onPress={stopTalk}
          className="bg-real-navy w-16 h-16"
        >
          <Image
            priority
            src={pauseSvg}
            alt="pause button"
          />
        </Button>
        <div
          className="absolute -top-20 -ml-16 h-20 w-48 p-2 rounded-2xl bg-default/80">
          <AudioWave isTalking={isTalking}/>
        </div>
      </div>
    )}
    </>
  );
}
