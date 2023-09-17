'use client'

import { Button } from '@nextui-org/button';
import { Tooltip } from '@nextui-org/tooltip';
import SettingBar from './_components/SettingBar';
import HandsFreeMode from './_components/HandsFreeMode';
import TextMode from './_components/TextMode';
import HamburgerMenu from './_components/HamburgerMenu';
import ShareButton from './_components/ShareButton';
import TabButton from '@/components/TabButton';
import Image from 'next/image';
import exitIcon from '@/assets/svgs/exit.svg';
import { BsChatRightText, BsTelephone } from 'react-icons/bs';
import {useEffect, useRef, useState} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import lz from 'lz-string';
import {playAudios} from "@/util/audioUtils";

export default function Conversation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ mode, setMode ] = useState('text');
  const {character, getAudioList, setCharacter, clearChatContent } = useAppStore();
  // Websocket.
  const {socketIsOpen, sendOverSocket, connectSocket, closeSocket } = useAppStore();
  // Media recorder.
  const {mediaRecorder, connectMicrophone, startRecording, stopRecording, closeMediaRecorder} = useAppStore();
  // Audio player
  const audioPlayerRef = useRef(null);
  const audioQueueRef = useRef(useAppStore.getState().audioQueue);
  const {isPlaying, setIsPlaying, popAudioQueueFront} = useAppStore();
  const {setAudioPlayerRef, stopAudioPlayback} = useAppStore();
  // Web RTC
  const {connectPeer, closePeer, micStream, incomingStreamDestination, audioContext, rtcConnectionEstablished} = useAppStore();
  const {vadEventsCallback, disableVAD, enableVAD, closeVAD} = useAppStore();

  useEffect(() => useAppStore.subscribe(
      state => (audioQueueRef.current = state.audioQueue)
  ), [])

  useEffect(()=>{
    const characterString = searchParams.get('character');
    const character = JSON.parse(lz.decompressFromEncodedURIComponent(characterString));
    setCharacter(character);
  },[]);

  // Bind current audio player to state ref.
  useEffect(() => {
      setAudioPlayerRef(audioPlayerRef);
  }, [])

  useEffect(() => {
      connectSocket();
  }, [character]);

  const handleOnTrack = event => {
    if (event.streams && event.streams[0]) {
      audioPlayerRef.current.srcObject = event.streams[0];
    }
  }

  useEffect(() => {
      getAudioList().then(
          () => {
              connectMicrophone();
          }
      ).then(()=> {
          connectPeer(handleOnTrack);
      });
  }, []);

  async function initializeVAD() {
      vadEventsCallback(micStream,
          () => {
              stopAudioPlayback();
              startRecording();
          },
          () => {
              // Stops recording and send interim audio clip to server.
              sendOverSocket('[&Speech]');
              stopRecording();
          },
          () => {
              sendOverSocket('[SpeechFinished]');
          })
  }

  useEffect(() => {
      if (!mediaRecorder || !socketIsOpen || !rtcConnectionEstablished) {
          return;
      }
      initializeVAD();
  }, [mediaRecorder, socketIsOpen, rtcConnectionEstablished]);

  // Reconnects websocket on setting change.
  const {preferredLanguage, selectedModel, enableGoogle, enableQuivr, enableMultiOn} = useAppStore();
  useEffect(() => {
      if (!mediaRecorder || !socketIsOpen || !rtcConnectionEstablished) {
          return;
      }
      closeVAD();
      closeSocket();
      clearChatContent();
      connectSocket();
      initializeVAD();
      if (mode === 'handsFree') {
          enableVAD();
      }
  }, [preferredLanguage, selectedModel, enableGoogle, enableQuivr, enableMultiOn]);

  // Audio Playback
  useEffect(() => {
          if (isPlaying && audioContext) {
              playAudios(
                  audioContext,
                  audioPlayerRef,
                  audioQueueRef,
                  isPlaying,
                  setIsPlaying,
                  incomingStreamDestination,
                  popAudioQueueFront
              );
          }
      }
, [isPlaying]);

  const [ isMute, setIsMute ] = useState(false);

  function handsFreeMode() {
    setMode('handsFree');
    enableVAD();
  }

  function textMode() {
    setMode('text');
    disableVAD();
  }

  function toggleMute() {
    setIsMute(!isMute);
    // TODO
  }

  const cleanUpStates = () => {
      disableVAD();
      closeVAD();
      closeMediaRecorder();
      closePeer();
      closeSocket();
      clearChatContent();
      setCharacter({});
  }

  return (
    <div className="relative">
      <audio ref={audioPlayerRef} className='audio-player'>
        <source src='' type='audio/mp3' />
      </audio>
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
              onPress={() => {
                router.push('/');
                cleanUpStates();
              }}
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
        <div className="flex flex-row justify-self-end md:hidden">
          <ShareButton/>
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
