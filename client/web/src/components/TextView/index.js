/**
 * src/components/TextView/index.jsx
 * show chat log. User can send message and switch to CallView.
 *
 * created by Lynchee on 7/16/23
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  TbPower,
  TbPhoneCall,
  TbMicrophone,
  TbPlayerStopFilled,
  TbKeyboard,
  TbShare2,
} from 'react-icons/tb';
import IconButton from '../Common/IconButton';
import { MdVoiceChat } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { ScrollArea } from '../ui/scroll-area';

const TextView = ({
  selectedCharacter,
  send,
  isPlaying,
  isThinking,
  isResponding,
  stopAudioPlayback,
  textAreaValue,
  setTextAreaValue,
  messageInput,
  setMessageInput,
  handleDisconnect,
  setIsCallView,
  useSearch,
  setUseSearch,
  callActive,
  startRecording,
  stopRecording,
  messageId,
  token,
  sessionId,
}) => {
  const navigate = useNavigate();
  const [keyboard, Setkeyboard] = useState(true);
  const chatWindowRef = useRef(null);
  const talking = useRef(false);

  // always show the latest chat log
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [textAreaValue]);

  useEffect(() => {
    if (
      isThinking &&
      !textAreaValue.endsWith(`\n${selectedCharacter.name} is thinking...`)
    ) {
      setTextAreaValue(
        prevState => prevState + `\n${selectedCharacter.name} is thinking...`
      );
    } else if (
      !isThinking &&
      textAreaValue.endsWith(`\n${selectedCharacter.name} is thinking...`)
    ) {
      setTextAreaValue(prevState =>
        prevState.substring(
          0,
          prevState.length - `\n${selectedCharacter.name} is thinking...`.length
        )
      );
    }
  }, [isThinking, textAreaValue]);

  // send message to server. stop audio if it's playing to interrupt character.
  const sendMessage = () => {
    setTextAreaValue(prevState => prevState + `\nYou> ${messageInput}\n`);
    send(messageInput);
    setMessageInput('');
    if (isPlaying) {
      stopAudioPlayback();
    }
  };

  const handleSendClick = () => {
    if (messageInput.trim() !== '') {
      sendMessage();
    }
  };

  const handleKeyDown = event => {
    if (event.key === 'Enter') {
      handleSendClick();
    }
  };

  const handleInputChange = event => {
    setMessageInput(event.target.value);
  };

  const handlePushTalk = () => {
    if (!talking.current) {
      startRecording();
      talking.current = true;
      if (isPlaying) {
        stopAudioPlayback();
      }
    } else {
      stopRecording();
      talking.current = false;
    }
  };

  return (
    <div className='w-full mt-5'>
      <ScrollArea className='h-60 w-full mb-2'>
        <Textarea
          className='h-80 resize-none'
          readOnly
          draggable='false'
          ref={chatWindowRef}
          value={textAreaValue}
        />
      </ScrollArea>
      <div className='grid w-full gap-2'>
        <Textarea
          className='w-full resize-none'
          placeholder='Type your message here.'
          value={messageInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        />
        {!callActive.current && !keyboard ? (
          <IconButton
            Icon={talking.current ? TbPlayerStopFilled : TbMicrophone}
            className={`${
              talking.current ? 'recording-animation' : 'icon-blue'
            }`}
            bgcolor={`${talking.current ? 'red' : 'default'}`}
            onClick={handlePushTalk}
          />
        ) : (
          <Button onClick={handleSendClick}>Send message</Button>
        )}
      </div>
    </div>
  );
};

export default TextView;
