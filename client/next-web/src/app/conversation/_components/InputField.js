import { useState } from 'react';
import { Button } from '@nextui-org/button';
import { Tooltip } from '@nextui-org/tooltip';
import InputEmoji from 'react-input-emoji';
import { IoPaperPlaneOutline } from 'react-icons/io5';
import { FaRegKeyboard } from 'react-icons/fa';
import Image from 'next/image';
import talkSvg from '@/assets/svgs/talk.svg';
import micSvg from '@/assets/svgs/microphone.svg';
import pauseSvg from '@/assets/svgs/pause.svg';
import {useAppStore} from "@/lib/store";

export default function InputField() {
  const [text, setText] = useState('');
  const [isTextInput, setIsTextInput] = useState(true);
  const [isTalking, setIsTalking] = useState(false);
  const {sendOverSocket, appendUserChat} = useAppStore();
  const {stopAudioPlayback} = useAppStore();
  const {startRecording, stopRecording} = useAppStore();

  function handleOnEnter() {
    if (text) {
      stopAudioPlayback();
      appendUserChat(text);
      sendOverSocket(text);
    }
  }

  function startTalk() {
    setIsTalking(true);
    startRecording();
  }

  function stopTalk() {
    setIsTalking(false);
    stopRecording();
  }

  return (
    <div className="flex justify-center md:mx-auto md:w-unit-9xl lg:w-[892px]">
      {isTextInput && (
      <div className="flex flex-row justify-center gap-2 w-full pb-7 pt-6">
        <Tooltip content="Talk">
          <Button
            isIconOnly
            variant="bordered"
            color="white"
            radius="full"
            size="md"
            onPress={() =>
              setIsTextInput(false)
            }
          >
            <Image
              priority
              src={talkSvg}
              alt="talk button"
            />
          </Button>
        </Tooltip>
        <InputEmoji
          value={text}
          onChange={setText}
          cleanOnEnter
          onEnter={handleOnEnter}
          placeholder="Your turn"
          fontSize={18}
          fontFamily=""
        />
        <Button
          size="md"
          className="bg-real-navy px-2 min-w-fit sm:min-w-16 sm:px-4 hidden md:flex"
          onPress={handleOnEnter}
        >
          <IoPaperPlaneOutline size="1.5em"/>
          <span className="hidden lg:inline">Send</span>
        </Button>
      </div>
      )}
      {!isTextInput && !isTalking && (
      <div className="flex flex-row items-center pt-4">
        <p className="font-light text-tiny absolute bottom-0 -ml-8">Click and start talking</p>
        <Tooltip content="Text">
          <Button
            isIconOnly
            variant="bordered"
            radius="full"
            color="white"
            size="md"
            onPress={() =>
              setIsTextInput(true)
            }
            className="-ml-[72px] md:-ml-[88px]"
          >
            <FaRegKeyboard/>
          </Button>
        </Tooltip>
        <div className="text-center ml-8 md:ml-12">
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
      </div>
      )}
      {!isTextInput && isTalking && (
      <div className="text-center pt-4">
          <p className="font-light text-tiny absolute top-0 -ml-8">Click to send message</p>
        <div className="mb-4">
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
        </div>
      </div>
      )}
    </div>
  );
}
