import { Button, Tooltip, Avatar, Chip, Input } from '@nextui-org/react';
import { IoIosSend } from 'react-icons/io';
import InputEmoji from 'react-input-emoji';
import { motion, AnimatePresence } from 'framer-motion';
import HamburgerMenu from '../HamburgerMenu';
import Image from 'next/image';
import exitIcon from '@/assets/svgs/exit.svg';
import Transcript from './Transcript';
import ActionChatPanel from './ActionChatPanel';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/zustand/store';

export default function JournalPage() {
  const router = useRouter();
  const [text, setText] = useState('');
  const {
    character,
    enableVAD,
    disableVAD,
    closeVAD,
    closeMediaRecorder,
    closePeer,
    closeSocket,
    clearChatContent,
    setCharacter,
    isRecording,
    speechInterim,
    appendUserRequest,
  } = useAppStore();

  const cleanUpStates = () => {
    disableVAD();
    closeVAD();
    closeMediaRecorder();
    closePeer();
    closeSocket();
    clearChatContent();
    setCharacter({});
  };

  function handleOnEnter() {
    appendUserRequest(text);
    setText('');
  }

  function handleOnEnterPress(e) {
    if (e.key === 'Enter') {
      handleOnEnter();
    }
  }

  return (
    <>
      <div className="fixed top-0 w-full bg-background z-10 h-24">
        <div className="grid grid-cols-4 gap-5 pt-5 md:pt-5 items-center">
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
          <div className="col-span-2 flex flex-col items-center">
            <div className="flex flex-row items-center gap-1">
              <Avatar
                name={character.name}
                src={character.image_url}
              />
              <span className="pl-2">{character.name}</span>
              <Chip
                size="sm"
                color="primary"
                className="text-tiny"
              >
                <span className="hidden md:flex">Journal Mode</span>
                <span className="flex md:hidden">JM</span>
              </Chip>
            </div>
            <div className="fixed top-16">
              <section className={`flex justify-center`}>
                <AnimatePresence>
                  {isRecording && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="font-light text-small md:text-base text-center py-1"
                    >
                      {speechInterim ? speechInterim : 'Listening...'}
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            </div>
          </div>
          <div className="flex justify-self-end mr-5">
            <HamburgerMenu />
          </div>
        </div>
      </div>
      <div className="h-full w-full px-4 mx-auto md:px-10 md:pb-4 flex flex-col lg:flex-row lg:gap-3">
        <div className="h-3/6 relative flex flex-col text-small lg:h-full lg:w-1/2 lg:border-b-1 border-real-blue-500/50 lg:border-x-1">
          <Transcript />
        </div>
        <div className="h-3/6 relative flex flex-col lg:h-full lg:w-1/2 lg:border-x-1 border-real-blue-500/50 lg:border-b-1">
          <ActionChatPanel />
          <div className="px-1 py-1 border-white/30 border-t-1 border-x-1 rounded-t-lg  journal_mode md:border-b-1 md:rounded-b-lg md:mx-2 md:mb-2">
            {/* <InputEmoji
              value={text}
              onChange={setText}
              cleanOnEnter
              onEnter={handleOnEnter}
              placeholder=""
              fontSize={16}
              fontFamily=""
            /> */}
            <Input
              value={text}
              onValueChange={setText}
              onKeyDown={handleOnEnterPress}
              placeholder=""
              label=""
              labelPlacement="outside"
              classNames={{
                input: 'bg-transparent',
                inputWrapper: [
                  'bg-transparent',
                  'hover:bg-transparent',
                  'data-[hover=true]:bg-transparent',
                  'group-data-[focus=true]:bg-transparent',
                ],
              }}
            />
            <div className="flex flex-row justify-between">
              <div></div>
              <Button
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
    </>
  );
}
