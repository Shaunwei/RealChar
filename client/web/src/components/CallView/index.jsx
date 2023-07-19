// CallView
import React, { useEffect, useRef } from 'react';
import './style.css';
import { TbPhoneCall } from 'react-icons/tb';
import { MdCallEnd } from 'react-icons/md';
import { TbMessageChatbot, TbPower } from 'react-icons/tb';

// utils
import { playAudios } from '../../utils/audioUtils';

const CallView = ( {isRecording, isPlaying, audioPlayer, handleStopCall, handleContinueCall, audioQueue, setIsPlaying, handleDisconnect, setIsTalkView} ) => {
    const audioContextRef = useRef(null);
    useEffect(() => {
      console.log(`CallView, useEffect, isPlaying: ${isPlaying}`);
      if (isPlaying) {
        playAudios(audioContextRef, audioPlayer, audioQueue, setIsPlaying);
      }
    }, [isPlaying]);
    
    return (
        <div className="main-screen">
            {isRecording ? (
                <>
                  <div>
                    <div className="sound-wave"><span></span><span></span><span></span><span></span><span></span><span></span></div>
                    <audio ref={audioPlayer} className="audio-player"><source src="" type="audio/mp3" /></audio>
                  </div>
                  <div className="stop-call" onClick={handleStopCall}>
                    <MdCallEnd className="icon-instance-node"/>
                  </div>
                </>
              ) : (
                <div className="continue-call" onClick={handleContinueCall}>
                  <TbPhoneCall className="icon-instance-node"/>
                </div>
            )}
            <div className="options-container">
              <div className="disconnect" onClick={handleDisconnect}>
                <TbPower className="icon-instance-node-small" />
              </div>
              <div className="message" onClick={() => setIsTalkView(false)}>
                    <TbMessageChatbot className="icon-instance-node-small" />
                  </div>
            </div>
        </div>
    )
}

export default CallView