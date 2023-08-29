'use client'
import { Button } from '@nextui-org/button';
import { Tooltip } from '@nextui-org/tooltip';
import SettingBar from './_components/SettingBar';
import HandsFreeMode from './_components/HandsFreeMode';
import TextMode from './_components/TextMode';
import TabButton from '@/components/TabButton';
import Image from 'next/image';
import exitIcon from '@/assets/svgs/exit.svg';
import { useState } from 'react';

//mocked data for demo
import {
  character,
  currentModel,
  modelList,
  currentSpeaker,
  speakerList,
  currentMicrophone,
  microphoneList,
  chatContent
} from '@/util/data';

export default function Conversation() {
  const [ mode, setMode ] = useState('handsFree');
  const [ model, setModel ] = useState(new Set([currentModel]));
  const [ speaker, setSpeaker ] = useState(new Set([currentSpeaker]));
  const [ isMute, setIsMute ] = useState(false);
  const [ microphone, setMicrophone ] = useState(new Set([currentMicrophone]));
  const [ inputMode, setInputMode ] = useState('keyboard');

  function handsFreeMode() {
    // TODO
    setMode('handsFree');
  }

  function textMode() {
    // TODO
    setMode('text');
  }

  function toggleMute() {
    setIsMute(!isMute);
    // TODO
  }

  function handleSpeakerSelect(keys) {
    setSpeaker(new Set(keys));
    // TODO
  }

  function handleMicrophoneSelect(keys) {
    setMicrophone(new Set(keys));
    // TODO
  }

  function handleLanguageModel(keys) {
    setModel(new Set(keys));
    // TODO
  }

  // async function handleShare(key) {
  //   // TODO
  //   switch(key) {
  //     case 'character':
  //       console.log('share character');
  //       return;
  //     case 'chat':
  //       console.log('share chat');
  //       return;
  //     default:
  //       return;
  //   }
  // }

  function openSettings() {

  }

  return (
    <div className="relative">
      <div className="grid grid-cols-4 gap-5 pt-10">
        <div>
          <Tooltip 
            content="Exit"
            placement="bottom"
          >
            <Button
              isBlock
              isIconOnly
              radius="full"
              className="hover:opacity-80 h-12 w-12 ml-5 mt-1 bg-button"
            >
              <Image
                priority
                src={exitIcon}
                alt="exit"
              />
            </Button>
          </Tooltip>
        </div>
        <div className="col-span-2 flex gap-5 border-2 rounded-full p-1 border-tab">
          <TabButton
            isSelected={mode==='handsFree'}
            handlePress={handsFreeMode}
          >
            Hands-free mode
          </TabButton>
          <TabButton
            isSelected={mode==="text"}
            handlePress={textMode}
          >
            Text mode
          </TabButton>
        </div>  
      </div>
      <div className="flex flex-col mx-48 mt-10 pt-6 border-t-2 border-divider">
        <SettingBar
          mode={mode}
          inputMode={inputMode}
          character={character}
          isMute={isMute}
          speaker={speaker}
          speakerList={speakerList}
          toggleMute={toggleMute}
          handleSpeakerSelect={handleSpeakerSelect}
          microphone={microphone}
          microphoneList={microphoneList}
          handleMicrophoneSelect={handleMicrophoneSelect}
          model={model}
          modelList={modelList}
          handleLanguageModel={handleLanguageModel}
          chatContent={chatContent}
          openSettings={openSettings}
        />
      </div>
      <div className="mx-48 mt-6">
        <HandsFreeMode 
          isDisplay={mode==='handsFree'}
          character={character}
          chatContent={chatContent}
        />
        <TextMode 
          isDisplay={mode==="text"}
          chatContent={chatContent}
        />
      </div>
    </div>
  );
}
