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
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import lz from 'lz-string';

export default function Conversation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ mode, setMode ] = useState('text');
  const { getAudioList, setCharacter } = useAppStore();

  useEffect(() => {
    const characterString = searchParams.get('character');
    const character = JSON.parse(lz.decompressFromEncodedURIComponent(characterString));
    setCharacter(character);
  }, []);

  useEffect(() => {
    getAudioList()
  }, [])

  const [ isMute, setIsMute ] = useState(false);

  function handsFreeMode() {
    setMode('handsFree');
    // TODO
  }

  function textMode() {
    setMode('text');
    // TODO
  }

  function toggleMute() {
    setIsMute(!isMute);
    // TODO
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
              onPress={() => router.push('/')}
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
            isSelected={mode==="text"}
            handlePress={textMode}
          >
            Text <span className="hidden lg:inline">mode</span>
          </TabButton>
          <TabButton
            isSelected={mode==='handsFree'}
            handlePress={handsFreeMode}
          >
            Hands-free <span className="hidden lg:inline">mode</span>
          </TabButton>
        </div>
      </div>
      <div className="flex flex-col mt-10 pt-6 border-t-2 border-divider md:mx-auto md:w-unit-9xl lg:w-[892px]">
        <SettingBar
          mode={mode}
          isMute={isMute}
          toggleMute={toggleMute}
        />
      </div>
      <div className="mt-6 md:mx-auto md:w-unit-9xl lg:w-[892px]">
        <HandsFreeMode
          isDisplay={mode==='handsFree'}
        />
        <TextMode
          isDisplay={mode==="text"}
        />
      </div>
    </div>
  );
}
