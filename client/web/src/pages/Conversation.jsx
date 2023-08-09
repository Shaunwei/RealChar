/**
 * src/pages/Conversation.jsx
 *
 * created by Lynchee on 7/28/23
 */

import React, { useEffect, useState } from 'react';
import CallView from '../components/CallView';
import TextView from '../components/TextView';
import { useNavigate, useLocation } from 'react-router-dom';
import queryString from 'query-string';
import Avatar from '@mui/material/Avatar';
import AvatarView from '../components/AvatarView';
import { extractEmotionFromPrompt } from '@avatechai/avatars';
import lz from 'lz-string';

// TODO: user can access this page only if isConnected.current

const Conversation = ({
  isConnecting,
  isConnected,
  isRecording,
  isPlaying,
  isThinking,
  isResponding,
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
  setUseSearch,
  callActive,
  startRecording,
  stopRecording,
  setPreferredLanguage,
  selectedCharacter,
  messageId,
  token,
  isTextStreaming,
  sessionId,
  setSelectedCharacter,
  setSelectedModel,
  setSelectedDevice,
  connect,
}) => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const {
    character = '',
    selectedModel = '',
    selectedDevice = '',
    isCallViewVal = '',
    preferredLanguage = '',
    useSearchVal = '',
  } = queryString.parse(search);
  const isCallView = isCallViewVal === 'true';
  const useSearch = useSearchVal === 'true';

  const message = isTextStreaming ? '' : textAreaValue;

  const [emotion, setEmotion] = useState('');

  useEffect(() => {
    const emotion = extractEmotionFromPrompt(message);
    if (emotion && emotion.length > 0) setEmotion(emotion);
  }, [message]);

  useEffect(() => {
    // console.log("conversation page")
    if (
      character === '' ||
      selectedModel === '' ||
      selectedDevice === '' ||
      isCallView === '' ||
      preferredLanguage === '' ||
      useSearch === ''
    ) {
      navigate('/');
    }
    // console.log("reached here")
    const selectedCharacter = JSON.parse(
      lz.decompressFromEncodedURIComponent(character)
    );
    setSelectedCharacter(selectedCharacter);
    console.log('updated selected character');
    setSelectedModel(selectedModel);

    setSelectedDevice(selectedDevice);

    setIsCallView(isCallView);

    setPreferredLanguage(preferredLanguage);

    setUseSearch(useSearch);

    console.log(
      selectedCharacter,
      selectedModel,
      selectedDevice,
      isCallView,
      preferredLanguage,
      useSearch
    );
    if (!isConnecting.current) {
      const tryConnect = async () => {
        try {
          console.log('trying to connect');
          await connect();
          console.log('connected');
        } catch (error) {
          console.error('Failed fetching data:', error);
        }
      };
      tryConnect();
    }

    const handleUnload = event => {
      event.preventDefault();
      navigate('/');
    };
    window.addEventListener('beforeunload', handleUnload);

    // Clean up event listener on component unmount
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  if (!isConnecting.current) {
    return null;
  }

  return (
    <div className='conversation-page'>
      {/* we render both views but only display one. */}
      <p className='alert text-white'>
        {isConnected.current && isThinking && isCallView ? (
          <span>{selectedCharacter.name} is thinking...</span>
        ) : isConnected.current && isRecording ? (
          <span className='recording'>Recording</span>
        ) : null}
      </p>

      <div className={`avatar-wrapper ${isPlaying ? 'pulsating-avatar' : ''}`}>
        {selectedCharacter?.avatar_id ? (
          <AvatarView
            avatarId={selectedCharacter?.avatar_id}
            emotion={emotion}
          />
        ) : (
          <Avatar
            alt={selectedCharacter.name}
            src={selectedCharacter.image_url}
            sx={{ width: 76, height: 76 }}
          />
        )}
      </div>

      <div
        className='main-screen'
        style={{ display: isCallView ? 'flex' : 'none' }}
      >
        <CallView
          isRecording={isRecording}
          isPlaying={isPlaying}
          isResponding={isResponding}
          audioPlayer={audioPlayer}
          handleStopCall={handleStopCall}
          handleContinueCall={handleContinueCall}
          audioQueue={audioQueue}
          setIsPlaying={setIsPlaying}
          handleDisconnect={handleDisconnect}
          setIsCallView={setIsCallView}
          sessionId={sessionId}
        />
      </div>

      <div
        className='main-screen'
        style={{ display: isCallView ? 'none' : 'flex' }}
      >
        <TextView
          selectedCharacter={selectedCharacter}
          send={send}
          isPlaying={isPlaying}
          isThinking={isThinking}
          isResponding={isResponding}
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
          messageId={messageId}
          token={token}
          sessionId={sessionId}
        />
      </div>
    </div>
  );
};

export default Conversation;
