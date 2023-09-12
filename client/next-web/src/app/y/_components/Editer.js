'use client';

import {
  Avatar,
  Button,
  Textarea,
} from '@nextui-org/react';
import Image from 'next/image';
import ImageSVG from '@/assets/svgs/image.svg';
import SmileSVG from '@/assets/svgs/emojiSmile.svg';
import EmojiPicker from 'emoji-picker-react';

import { useState, useRef } from 'react';
import { useAuthContext } from '@/context/AuthContext';

export default function Editer() {
  const { user } = useAuthContext();
  const [ open, setOpen ] = useState(false);
  const [ textValue, setTextValue ] = useState('');
  const textRef = useRef('');

  function handleValueChange(value) {
    textRef.current = value;
    setTextValue(value);
  }

  function handleEmojiClick(emojiObject, e) {
    textRef.current += emojiObject.emoji;
    setTextValue(textRef.current);
  }

  return (
    <div className="px-4 py-2.5 flex flex-row gap-3 relative">
      <Avatar src={user.photoURL} alt="user avatar" className="w-12 h-12"/>
      <div className="grow">
        <Textarea
          placeholder="What's happening?"
          classNames={{
            inputWrapper: 'bg-transparent data-[hover=true]:bg-transparent group-data-[focus=true]:bg-transparent',
            input: 'text-lg placeholder:font-medium placeholder:text-real-dark-6'
          }}
          value={textValue}
          onValueChange={handleValueChange}
        />
        <div className="flex flex-row justify-between relative">
          <div>
            <Button
              isIconOnly
              variant="light"
            >
              <Image priority src={ImageSVG} alt="image button"/>
            </Button>
            <Button
              isIconOnly
              variant="light"
              onPress={() => {setOpen(!open)}}
            >
              <Image priority src={SmileSVG} alt="emoji picker" />
            </Button>
            <div className={`absolute z-50 t-0 ${open?'flex':'hidden'}`}>
              <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark"/>
            </div>
          </div>
          <Button
            className="font-semibold text-base bg-real-contrastBlue"
          >
            Post
          </Button>
        </div>
      </div>
      <div
        className={`fixed w-screen h-screen top-0 left-0 z-10 ${open?'flex':'hidden'}`}
        onClick={()=>{setOpen(false)}}></div>
    </div>
  );
}
