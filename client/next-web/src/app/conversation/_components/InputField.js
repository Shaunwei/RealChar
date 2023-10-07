import { useState } from 'react';
import { Button } from '@nextui-org/button';
import InputEmoji from 'react-input-emoji';
import { IoIosSend } from 'react-icons/io';
import ClickToTalk from './ClickToTalk';
import {useAppStore} from "@/zustand/store";

export default function InputField() {
  const [text, setText] = useState('');
  const {sendOverSocket, appendUserChat} = useAppStore();
  const {stopAudioPlayback} = useAppStore();

  function handleOnEnter() {
    if (text) {
      stopAudioPlayback();
      appendUserChat(text);
      sendOverSocket(text);
      setText('');
    }
  }

  return (
    <div className="flex justify-center md:mx-auto md:w-unit-9xl lg:w-[892px]">
      <div className="flex md:hidden flex-col justify-center w-full pb-1">
        <div className="mobile_conversation">
          <InputEmoji
            value={text}
            onChange={setText}
            cleanOnEnter
            onEnter={handleOnEnter}
            placeholder="Your turn"
            fontSize={16}
            fontFamily=""
          />
        </div>
        <div className="flex flex-row justify-between items-center">
          <div className="pl-14 flex flex-row gap-1">

          </div>
          <div className="mr-4 h-10">
            {text === '' ? (
              <ClickToTalk className="" />
            ) : (
              <Button
                size="md"
                className="bg-real-navy px-2 min-w-fit sm:min-w-16 sm:px-4 md:flex h-9 disabled:bg-transparent"
                onPress={handleOnEnter}
              >
                <IoIosSend size="2em" />
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="hidden md:flex flex-col justify-center w-full pb-1">
        <div>
          <InputEmoji
            value={text}
            onChange={setText}
            cleanOnEnter
            onEnter={handleOnEnter}
            placeholder="Your turn"
            fontSize={16}
            fontFamily=""
          />
        </div>
        <div className="flex flex-row justify-between items-center">
          <div className="pl-14 flex flex-row gap-1">
            <ClickToTalk className="" />
          </div>
          <div className="mr-4 h-10">
            <Button
              size="md"
              isDisabled={text === ''}
              className="bg-real-navy px-2 min-w-fit sm:min-w-16 sm:px-4 md:flex h-9 disabled:bg-transparent"
              onPress={handleOnEnter}
            >
              <IoIosSend size="2em" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
