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

const CallView = ( {isRecording, isPlaying, audioPlayer, handleStopCall, handleContinueCall, audioQueue, setIsPlaying, handleDisconnect, setIsTalkView} ) => {
    const audioContextRef = useRef(null);
    useEffect(() => {
      if (isPlaying) {
        playAudios(audioContextRef, audioPlayer, audioQueue, setIsPlaying);
      }
    }, [isPlaying]);
    
    return (
          <>
            <audio ref={audioPlayer} className="audio-player"><source src="" type="audio/mp3" /></audio>
            {isRecording ? (
                <>
                  <div className="sound-wave"><span></span><span></span><span></span><span></span><span></span><span></span></div>
                  <IconButton Icon={MdCallEnd} className="icon-red" bgcolor="red" onClick={handleStopCall} />
                </>
              ) : (
                <IconButton Icon={TbPhoneCall} className="icon-green" bgcolor="green" onClick={handleContinueCall} />
            )}
            <div className="options-container">
              <IconButton Icon={TbPower} className="icon-red" onClick={handleDisconnect} />
              <IconButton Icon={TbMessageChatbot} className="icon-green" onClick={() => setIsTalkView(false)} />
            </div>
          </>
    )
}

export default CallView