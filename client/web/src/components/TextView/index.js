/**
 * src/components/TextView/index.jsx
 * show chat log. User can send message and switch to CallView.
 * 
 * created by Lynchee on 7/16/23
 */

import React, { useEffect, useRef } from 'react';
import './style.css';
import { TbPower, TbMicrophone } from 'react-icons/tb';
import IconButton from '../Common/IconButton';

const TextView = ({ send, isPlaying, stopAudioPlayback, textAreaValue, setTextAreaValue, messageInput, setMessageInput, handleDisconnect, setIsCallView }) => {
    const chatWindowRef = useRef(null);
    
    // always show the latest chat log
    useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, [textAreaValue]);

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

    return (
        <>
            <textarea 
                className="chat-window" 
                readOnly 
                draggable="false"
                ref={chatWindowRef}
                value={textAreaValue}
            ></textarea>
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
            <button className="send-btn" onClick={handleSendClick}>Send Message</button>
            <div className="options-container">
                <IconButton Icon={TbPower} className="icon-red" onClick={handleDisconnect} />
                <IconButton Icon={TbMicrophone} className="icon-blue" onClick={() => setIsCallView(true)} />
            </div>
        </>
    )
}

export default TextView