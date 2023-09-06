'use client'
import { Button } from '@nextui-org/button';
import { Tooltip } from '@nextui-org/tooltip';
import SettingBar from './_components/SettingBar';
import HandsFreeMode from './_components/HandsFreeMode';
import TextMode from './_components/TextMode';
import HamburgerMenu from './_components/HamburgerMenu';
import TabButton from '@/components/TabButton';
import Image from 'next/image';
import exitIcon from '@/assets/svgs/exit.svg';
import { BsChatRightText, BsTelephone } from 'react-icons/bs';
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
      <div className="grid grid-cols-4 gap-5 pt-4 md:pt-10 items-center">
        <div>
          <Tooltip
            content="Exit"
            placement="bottom"
          >
            <Button
              isBlock
              isIconOnly
              radius="full"
              className="hover:opacity-80 h-8 w-8 md:h-12 md:w-12 ml-5 mt-1 bg-button"
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
            className="min-w-fit h-fit py-2 md:min-w-20 md:h-11 md:py-4"
          >
            <span className="md:hidden"><BsChatRightText size="1.2em"/></span><span className="hidden md:inline">Text</span><span className="hidden lg:inline">&nbsp;mode</span>
          </TabButton>
          <TabButton
            isSelected={mode==='handsFree'}
            handlePress={handsFreeMode}
            className="min-w-fit h-fit py-2 md:min-w-20 md:h-11 md:py-4"
          >
            <span className="md:hidden"><BsTelephone size="1.2em"/></span><span className="hidden md:inline">Hands-free</span><span className="hidden lg:inline">&nbsp;mode</span>
          </TabButton>
        </div>
        <div className="justify-self-end md:hidden">
          <HamburgerMenu/>
        </div>
      </div>
      <div className="flex flex-col mt-4 md:mt-10 pt-2 md:pt-6 border-t-2 border-divider md:mx-auto md:w-unit-9xl lg:w-[892px]">
        <SettingBar
          mode={mode}
          isMute={isMute}
          toggleMute={toggleMute}
        />
      </div>
      <div className="mt-6 w-full px-4 md:px-0 mx-auto md:w-unit-9xl lg:w-[892px]">
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
