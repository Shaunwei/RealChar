/**
 * src/pages/Conversation.jsx
 * 
 * created by Lynchee on 7/28/23
 */

import React, {useEffect} from 'react';
import CallView from '../components/CallView';
import TextView from '../components/TextView';
import { useNavigate } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import AvatarView from '../components/AvatarView';

// TODO: user can access this page only if isConnected.current

const Conversation = ({
  isConnecting,
  isConnected,
  isCallView,
  isRecording,
  isPlaying,
  audioPlayer,
  handleStopCall,
  handleContinueCall,
  audioQueue,
  setIsPlaying,
  handleDisconnect,
  setIsCallView,
  send,
  stopAudioPlayback,
  textAreaValue,
  setTextAreaValue,
  messageInput,
  setMessageInput,
  useSearch,
  setUseSearch,
  callActive,
  startRecording,
  stopRecording,
  preferredLanguage,
  setPreferredLanguage,
  selectedCharacter,
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isConnecting.current) {
      navigate('/');
    }

    const handleUnload = (event) => {
      event.preventDefault();
      navigate('/');
    };
    window.addEventListener("beforeunload", handleUnload);

    // Clean up event listener on component unmount
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [isConnecting, navigate]);

  if (!isConnecting.current) {
    return null; 
  }

return (
    <div className='conversation-page'>
        {/* we render both views but only display one. */}
        <p className="alert text-white">
          { isConnected.current && isRecording ? 
            (<span className="recording">Recording</span>) : null
          } 
        </p>

        <div className={`avatar-wrapper ${isPlaying ? "pulsating-avatar" : ""}`}>
          {
            selectedCharacter?.avatar_id ?
              <AvatarView avatarId={
                selectedCharacter?.avatar_id
              }/> 
            :
          <Avatar
            alt={selectedCharacter.name}
            src={selectedCharacter.image_url}
            sx={{ width: 76, height: 76 }}
          />
          }
        </div>

        <div className="main-screen" style={{ display: isCallView ? "flex" : "none" }}>
          <CallView 
            isRecording={isRecording} 
            isPlaying={isPlaying}
            audioPlayer={audioPlayer} 
            handleStopCall={handleStopCall} 
            handleContinueCall={handleContinueCall}
            audioQueue={audioQueue}
            setIsPlaying={setIsPlaying}
            handleDisconnect={handleDisconnect}
            setIsCallView={setIsCallView}
          />
        </div>

        <div className="main-screen" style={{ display: isCallView ? "none" : "flex" }}>
          <TextView 
            send={send} 
            isPlaying={isPlaying}
            stopAudioPlayback={stopAudioPlayback}
            textAreaValue={textAreaValue}
            setTextAreaValue={setTextAreaValue}
            messageInput={messageInput}
            setMessageInput={setMessageInput}
            handleDisconnect={handleDisconnect}
            setIsCallView={setIsCallView}
            useSearch={useSearch}
            setUseSearch={setUseSearch}
            callActive={callActive}
            startRecording={startRecording}
            stopRecording={stopRecording}
            preferredLanguage={preferredLanguage}
            setPreferredLanguage={setPreferredLanguage}
          />
        </div>
      </div>
    );
};

export default Conversation;
