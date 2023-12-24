import { Button } from '@nextui-org/react';
import { BiMicrophone } from 'react-icons/bi';
import { BsCheckLg } from 'react-icons/bs';
import { useState } from 'react';
import { useAppStore } from '@/zustand/store';
import AudioWave from './AudioWave';

export default function ClickToTalk({ className }) {
  const [isTalking, setIsTalking] = useState(false);
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
          <Button
            isIconOnly
            aria-label="start talking"
            size="md"
            radius="full"
            variant="light"
            className="text-neutral-500"
            onPress={startTalk}
          >
            <BiMicrophone size="1.7em" />
          </Button>
        </div>
      ) : (
        <div className={className}>
          <div className="flex flex-col md:hidden bg-background absolute w-full h-24 bottom-0 left-0 z-10 -mb-2 pb-2 justify-center">
            <div className="font-light text-tiny flex gap-1 justify-center items-center">
              <BiMicrophone />
              Click to send message
            </div>
            <div className="flex flex-row bg-background items-center gap-2 px-2">
              <div className="grow bg-default/80 rounded-2xl">
                <AudioWave isTalking={isTalking} />
              </div>
              <Button
                isIconOnly
                aria-label="stop talking"
                radius="full"
                size="md"
                onPress={stopTalk}
                className="bg-real-blue-500"
              >
                <BsCheckLg size="1.5em" />
              </Button>
            </div>
          </div>
          <div className="hidden md:flex">
            <Button
              isIconOnly
              aria-label="stop talking"
              radius="full"
              size="md"
              onPress={stopTalk}
              className="bg-real-blue-500 z-10"
            >
              <BsCheckLg size="1.5em" />
            </Button>
            <div className="absolute -top-16 -ml-14 h-20 w-48 p-6 rounded-2xl bg-default/80">
              <AudioWave isTalking={isTalking} />
            </div>
            <div className="backdrop absolute top-0 bottom-0 left-0 right-0 bg-background/10"></div>
          </div>
        </div>
      )}
    </>
  );
}
