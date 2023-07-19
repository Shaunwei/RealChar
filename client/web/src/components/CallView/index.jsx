/**
 * src/components/CallView/index.jsx
 * User can stop or continue the call. Allows audios playing and switch to TextView.
 * 
 * created by Lynchee on 7/16/23
 */

import React, { useEffect, useRef } from 'react';
import './style.css';
import { TbPhoneCall } from 'react-icons/tb';
import { MdCallEnd } from 'react-icons/md';
import { TbMessageChatbot, TbPower } from 'react-icons/tb';
import IconButton from '../Common/IconButton';

// utils
import { playAudios } from '../../utils/audioUtils';

const CallView = ( {isRecording, isPlaying, audioPlayer, handleStopCall, handleContinueCall, audioQueue, setIsPlaying, handleDisconnect, setIsCallView} ) => {
    const audioContextRef = useRef(null);

    useEffect(() => {
      if (isPlaying) {
        playAudios(audioContextRef, audioPlayer, audioQueue, setIsPlaying);
      }
    }, [isPlaying]);
    
    return (
        <>
          <div className='call-container'>
            <audio ref={audioPlayer} className="audio-player"><source src="" type="audio/mp3" /></audio>
            <div className={`sound-wave ${isRecording ? '' : 'stop-animation'}`}>
                <span></span><span></span><span></span><span></span><span></span><span></span>
            </div>
            <IconButton Icon={MdCallEnd} className={`icon-red ${isRecording ? '' : 'hidden'}`} bgcolor="red" onClick={handleStopCall} />
            <IconButton Icon={TbPhoneCall} className={`icon-green ${isRecording ? 'hidden' : ''}`} bgcolor="green" onClick={handleContinueCall} />
          </div>
          <div className="options-container">
              <IconButton Icon={TbPower} className="icon-red" onClick={handleDisconnect} />
              <IconButton Icon={TbMessageChatbot} className="icon-green" onClick={() => setIsCallView(false)} />
          </div>
        </>
    )
}

export default CallView
