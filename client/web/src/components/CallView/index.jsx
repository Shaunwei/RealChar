/**
 * src/components/CallView/index.jsx
 * User can stop or continue the call. Allows audios playing and switch to TextView.
 *
 * created by Lynchee on 7/16/23
 */

import React, { useEffect, useState } from 'react';
import './style.css';
import { useNavigate } from 'react-router-dom';
import { TbPhoneCall } from 'react-icons/tb';
import { MdCallEnd } from 'react-icons/md';
import { TbMessageChatbot, TbPower, TbShare2 } from 'react-icons/tb';
import IconButton from '../Common/IconButton';
import { setAnalyser } from '../../components/AvatarView';
// utils
import { playAudios } from '../../utils/audioUtils';

const CallView = ({
  isRecording,
  isPlaying,
  isResponding,
  audioPlayer,
  handleStopCall,
  handleContinueCall,
  audioQueue,
  audioContextRef,
  audioSourceNodeRef,
  setIsPlaying,
  handleDisconnect,
  setIsCallView,
  sessionId,
  playAudioFromNode,
}) => {
  const { initialize, setInitialize } = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isPlaying && audioContextRef.current) {
      playAudios(
        audioContextRef,
        audioPlayer,
        audioQueue,
        setIsPlaying,
        playAudioFromNode,
        audioSourceNodeRef,
        initialize,
        setInitialize
      );
    }
  }, [isPlaying]);

  const handlePowerOffClick = () => {
    navigate('/');
    handleDisconnect();
  };

  return (
    <div className='call-screen'>
      <div className='call-container'>
        <audio ref={audioPlayer} className='audio-player'>
          <source src='' type='audio/mp3' />
        </audio>
        <div className={`sound-wave ${isRecording ? '' : 'stop-animation'}`}>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
        {isRecording ? (
          <IconButton
            Icon={MdCallEnd}
            className='icon-red'
            bgcolor='red'
            onClick={handleStopCall}
          />
        ) : (
          <IconButton
            Icon={TbPhoneCall}
            className='icon-green'
            bgcolor='green'
            onClick={handleContinueCall}
          />
        )}
      </div>
      <div className='options-container'>
        <IconButton
          Icon={TbPower}
          className='icon-red'
          onClick={handlePowerOffClick}
        />
        <IconButton
          Icon={TbMessageChatbot}
          className='icon-green'
          onClick={() => setIsCallView(false)}
        />
        <IconButton
          Icon={TbShare2}
          disabled={isResponding}
          onClick={() =>
            window.open(`/shared?session_id=${sessionId}`, '_blank')
          }
        />
      </div>
    </div>
  );
};

export default CallView;
