import { useState } from 'react';
import { Button } from '@nextui-org/button';
import InputEmoji from 'react-input-emoji';
import { IoIosSend } from 'react-icons/io';
import ClickToTalk from './ClickToTalk';
import InputAddition from './InputAddition';

import { useAppStore } from '@/zustand/store';
import { handleCommand } from '@/util/stringUtil.js';

export default function InputField() {
  const [text, setText] = useState('');
  const { sendOverSocket, appendUserChat, appendChatMsg, callOutgoing } =
    useAppStore();
  const { stopAudioPlayback } = useAppStore();

  function handleOnEnter() {
    if (text) {
      stopAudioPlayback();
      appendUserChat(text);
      if (text.startsWith('/')) {
        // command
        const command = handleCommand(text);
        switch (command.action) {
          case 'call':
            if (
              command.options.hasOwnProperty('number') &&
              command.options.number.match(/^\+?[1-9]\d{1,14}$/g)
            ) {
              let vad_threshold = 0.8;
              if (command.options.hasOwnProperty('vad_threshold')) {
                vad_threshold = command.options.vad_threshold;
              }
              // call endpoint
              callOutgoing(command.options.number, vad_threshold);
            } else {
              setTimeout(() => {
                appendChatMsg('Please provide correct number option');
              }, 100);
            }
            break;
          default:
            setTimeout(() => {
              appendChatMsg('Unknown command');
            }, 100);
            break;
        }
      } else {
        sendOverSocket(text);
      }
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
          <div className="pl-2 flex flex-row gap-1">
            <InputAddition setText={setText} />
            <div></div>
          </div>
          <div className="mr-4 h-10">
            {text === '' ? (
              <ClickToTalk className="" />
            ) : (
              <Button
                aria-label="send"
                size="md"
                className="bg-real-blue-500 px-2 min-w-fit sm:min-w-16 sm:px-4 md:flex h-9 disabled:bg-transparent"
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
          <div className="pl-2 flex flex-row gap-1">
            <InputAddition />
            <div className="w-10"></div>
            <ClickToTalk className="" />
          </div>
          <div className="mr-4 h-10">
            <Button
              aria-label="send"
              size="md"
              isDisabled={text === ''}
              className="bg-real-blue-500 px-2 min-w-fit sm:min-w-16 sm:px-4 md:flex h-9 disabled:bg-transparent"
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
