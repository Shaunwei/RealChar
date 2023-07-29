/**
 * src/components/TextView/index.jsx
 * show chat log. User can send message and switch to CallView.
 * 
 * created by Lynchee on 7/16/23
 */

import React, { useEffect, useRef, useState} from 'react';
import './style.css';
import { TbPower, TbPhoneCall, TbMicrophone, TbPlayerStopFilled, TbKeyboard } from 'react-icons/tb';
import IconButton from '../Common/IconButton';
import { MdVoiceChat } from 'react-icons/md';
import Button from '../Common/Button';
import { useNavigate } from 'react-router-dom';


const TextView = ({ send, isPlaying, stopAudioPlayback, textAreaValue, setTextAreaValue, messageInput, setMessageInput, handleDisconnect, setIsCallView, useSearch, setUseSearch, callActive, startRecording, stopRecording }) => {
    const navigate = useNavigate();
    const [keyboard, SetKeyboard] = useState(true);
    const chatWindowRef = useRef(null);
    const talking = useRef(false);
    
    // always show the latest chat log
    useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, [textAreaValue]);

    const handlePowerOffClick = () => {
        navigate('/');
        handleDisconnect();
    }

    // send message to server. stop audio if it's playing to interrupt character.
    const sendMessage = () => {
        setTextAreaValue(prevState => prevState + `\nYou> ${messageInput}\n`);
        send(messageInput);
        setMessageInput('');
        if (isPlaying) {
            stopAudioPlayback();
        }
    }

    const handleSendClick = () => {
        if (messageInput.trim() !== '') {
            sendMessage();
        }
    }

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            handleSendClick();
        }
    };

    const handleInputChange = (event) => {
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
    }

    const handleKeyboardClick = () => {
        SetKeyboard(true);
    }
    
    const handleAudioClick = () => {
        SetKeyboard(false);
    }

    return (
        <div className='text-screen'>
            <textarea 
                className="chat-window" 
                readOnly 
                draggable="false"
                ref={chatWindowRef}
                value={textAreaValue}
            ></textarea>
            <div className='input-container'>
                <div className="message-input-container">
                    <input
                        className="message-input" 
                        type="text" 
                        placeholder="Type your message"
                        value={messageInput} 
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown} 
                    />
                    <span className="focus-border"><i></i></span>
                </div>
                { !callActive.current && (
                    <div>
                        {keyboard ? 
                            <IconButton Icon={MdVoiceChat} className="icon-blue" onClick={handleAudioClick} /> : 
                            <IconButton Icon={TbKeyboard} className="icon-blue" onClick={handleKeyboardClick} />
                        }
                    </div>
                )}
            </div>

            { !callActive.current && !keyboard ?
                <IconButton Icon={talking.current ? TbPlayerStopFilled : TbMicrophone} className={`${talking.current ? "recording-animation" : "icon-blue"}`} bgcolor={`${talking.current ? "red":"default"}`} onClick={handlePushTalk} /> : 
                <Button onClick={handleSendClick} name="Send Message" />
            }
            
            <div className="options-container">
                <IconButton Icon={TbPower} className="icon-red" onClick={handlePowerOffClick} />
                <IconButton Icon={TbPhoneCall} className="icon-blue" onClick={() => setIsCallView(true)} disabled={talking.current} />
            </div>
        </div>
    )
}

export default TextView