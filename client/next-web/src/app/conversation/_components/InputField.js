import { useState } from 'react';
import { Button } from '@nextui-org/button';
import { Tooltip } from '@nextui-org/tooltip';
import InputEmoji from 'react-input-emoji';
import { IoPaperPlaneOutline } from 'react-icons/io5';
import { FaRegKeyboard } from 'react-icons/fa';
import Image from 'next/image';
import talkSvg from '@/assets/svgs/talk.svg';
import ClickToTalk from './ClickToTalk';
import {useAppStore} from "@/lib/store";

export default function InputField() {
  const [text, setText] = useState('');
  const [isTextInput, setIsTextInput] = useState(true);
  const {sendOverSocket, appendUserChat} = useAppStore();
  const {stopAudioPlayback} = useAppStore();

  function handleOnEnter() {
    if (text) {
      stopAudioPlayback();
      appendUserChat(text);
      sendOverSocket(text);
    }
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
      {!isTextInput && (
      <div className="flex flex-row items-center pt-4">
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
        <ClickToTalk className="text-center ml-8 md:ml-12"/>
      </div>
      )}
    </div>
  );
}
