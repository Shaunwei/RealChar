// TextView
import React, { useEffect, useState } from 'react';
import './style.css';
import { TbPower, TbMicrophone } from 'react-icons/tb';

const TextView = ({ send, isPlaying, stopAudioPlayback, textAreaValue, setTextAreaValue, messageInput, setMessageInput, handleDisconnect, setIsTalkView }) => {
    const sendMessage = () => {
        setTextAreaValue(prevState => prevState + `\nYou> ${messageInput}\n`);
        // chatWindow.scrollTop = chatWindow.scrollHeight;
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
        <div className="main-screen">
            <textarea 
                className="chat-window" 
                readOnly 
                draggable="false"
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
                <div className="disconnect" onClick={handleDisconnect}>
                    <TbPower className="icon-instance-node-small" />
                </div>
                <div className="call" onClick={() => setIsTalkView(true)}>
                    <TbMicrophone className="icon-instance-node-small" />
                </div>
            </div>
        </div>
    )
}

export default TextView