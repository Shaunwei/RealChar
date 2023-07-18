// TextView
import React, { useEffect, useState } from 'react';
import './style.css';

const TextView = ({ socket, isPlaying, stopAudioPlayback }) => {
    const [messageInput, setMessageInput] = useState('');

    const sendMessage = () => {
        if (socket.current && socket.current.readyState === WebSocket.OPEN) {
            // chatWindow.value += `\nYou> ${message}\n`;
            // chatWindow.scrollTop = chatWindow.scrollHeight;
            socket.current.send(messageInput);
            setMessageInput('');
            if (isPlaying) {
                stopAudioPlayback();
            }
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
            <textarea className="chat-window" readOnly draggable="false"></textarea>
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
        </>
    )
}

export default TextView