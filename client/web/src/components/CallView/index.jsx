// CallView
import React, { useEffect, useState } from 'react';
import './style.css';
import endCallIcon from '../../assets/svgs/end-call.svg'; 
import { TbPhoneCall } from 'react-icons/tb';
import { MdCallEnd } from 'react-icons/md';

const CallView = ( {isRecording, audioPlayer, handleStopCall, handleContinueCall} ) => {
    return (
        <>
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
        </>
    )
}

export default CallView