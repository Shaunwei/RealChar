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
import { useAppStore } from '@/lib/store';

export default function InputField() {
  const [text, setText] = useState('');
  const [isTextInput, setIsTextInput] = useState(true);
  const [isTalking, setIsTalking] = useState(false);
  const { sendOverSocket, appendUserChat } = useAppStore();
  const { stopAudioPlayback } = useAppStore();
  const { startRecording, stopRecording } = useAppStore();

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
    <div className='flex justify-center md:mx-auto md:w-unit-9xl lg:w-[892px]'>
      {isTextInput && (
        <div className='flex flex-row justify-center gap-4 w-full pb-10 pt-4'>
          <Tooltip content='Talk'>
            <Button
              isIconOnly
              variant='bordered'
              color='white'
              radius='full'
              size='lg'
              onPress={() => setIsTextInput(false)}
            >
              <Image priority src={talkSvg} alt='talk button' />
            </Button>
          </Tooltip>
          <InputEmoji
            value={text}
            onChange={setText}
            cleanOnEnter
            onEnter={handleOnEnter}
            placeholder='Your turn'
            fontSize={18}
            fontFamily=''
          />
          <Button
            size='lg'
            className='bg-real-navy px-2 min-w-fit sm:min-w-16 sm:px-4 hidden md:flex'
            onPress={handleOnEnter}
          >
            <IoPaperPlaneOutline size='1.5em' />
            <span className='hidden lg:inline'>Send</span>
          </Button>
        </div>
      )}
      {!isTextInput && !isTalking && (
        <div className='flex flex-row items-center'>
          <Tooltip content='Text'>
            <Button
              isIconOnly
              variant='bordered'
              radius='full'
              color='white'
              size='lg'
              onPress={() => setIsTextInput(true)}
              className='-ml-16 md:-ml-24'
            >
              <FaRegKeyboard />
            </Button>
          </Tooltip>
          <div className='text-center ml-8 md:ml-12'>
            <Button
              isIconOnly
              size='lg'
              radius='full'
              className='bg-real-navy w-24 h-24 mb-4'
              onPress={startTalk}
            >
              <Image
                priority
                src={micSvg}
                alt='microphone button'
                className='w-6'
              />
            </Button>
            {/* <p className="font-light">Click and start talking</p> */}
          </div>
        </div>
      )}
      {!isTextInput && isTalking && (
        <div className='text-center'>
          {/* <p className="font-light mb-10">You <span className="text-white/50">are speaking...</span></p> */}
          <div className='mb-4'>
            <span className='animate-ping absolute w-24 h-24 bg-real-navy opacity-50 rounded-full'></span>
            <Button
              isIconOnly
              radius='full'
              size='lg'
              onPress={stopTalk}
              className='bg-real-navy w-24 h-24'
            >
              <Image priority src={pauseSvg} alt='pause button' />
            </Button>
          </div>
          {/* <p className="font-light">Click and stop talking</p> */}
        </div>
      )}
    </div>
  );
}
