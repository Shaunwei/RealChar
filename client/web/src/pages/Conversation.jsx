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
import useAvatarView from '../components/AvatarView';
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
  audioContextRef,
  audioSourceNodeRef,
  setIsPlaying,
  handleDisconnect,
  isCallView,
  setIsCallView,
  send,
  stopAudioPlayback,
  textAreaValue,
  setTextAreaValue,
  messageInput,
  setMessageInput,
  setUseSearch,
  setUseEchoCancellation,
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
  setUseMultiOn,
  connect,
}) => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const {
    character = '',
    selectedModel = '',
    selectedDevice = '',
    isCallViewParam = '',
    preferredLanguage = '',
    useSearchParam = '',
    useEchoCancellationParam = '',
    useMultiOnParam = '',
  } = queryString.parse(search);
  const isCallViewUrl = isCallViewParam === 'true';
  const useSearch = useSearchParam === 'true';
  const useEchoCancellation = useEchoCancellationParam === 'true';
  const useMultiOn = useMultiOnParam === 'true';
  const message = isTextStreaming ? '' : textAreaValue;
  const [emotion, setEmotion] = useState('');

  const { avatarDisplay, handleFirstInteractionAudio } = useAvatarView(
    '33a63fd9-54db-4544-a2c8-1fc74e6f6c9f',
    emotion
  );

  useEffect(() => {
    const emotion = extractEmotionFromPrompt(message);
    if (emotion && emotion.length > 0) setEmotion(emotion);
  }, [message]);

  useEffect(() => {
    if (
      character === '' ||
      selectedModel === '' ||
      selectedDevice === '' ||
      isCallViewUrl === '' ||
      preferredLanguage === '' ||
      useSearch === '' ||
      useEchoCancellation === ''
    ) {
      navigate('/');
    }
    const paramSelectedCharacter = JSON.parse(
      lz.decompressFromEncodedURIComponent(character)
    );
    setSelectedCharacter(paramSelectedCharacter);

    setSelectedModel(selectedModel);

    setSelectedDevice(selectedDevice);

    setIsCallView(isCallViewUrl);

    setPreferredLanguage(preferredLanguage);

    setUseSearch(useSearch);

    setUseEchoCancellation(useEchoCancellation);

    setUseMultiOn(useMultiOn);
  }, []);

  useEffect(() => {
    if (!isConnecting.current) {
      const tryConnect = async () => {
        try {
          // requires login if user wants to use gpt4 or claude.
          connect();
        } catch (error) {
          console.error(error);
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
  }, [connect]);

  if (!isConnected.current) {
    return null;
  }

  return (
    <main className='p-8 mx-auto max-w-7xl w-full' style={{ height: '100vh' }}>
      {/* we render both views but only display one. */}
      <p className='alert text-white'>
        {isConnected.current && isThinking && isCallView ? (
          <span>{selectedCharacter.name} is thinking...</span>
        ) : isConnected.current && isRecording ? (
          <span className='recording'>Recording</span>
        ) : null}
      </p>
      <div className='flex flex-col space-y-4 w-full justify-center items-center'>
        {avatarDisplay}
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
          audioContextRef={audioContextRef}
          audioSourceNodeRef={audioSourceNodeRef}
          setIsPlaying={setIsPlaying}
          handleDisconnect={handleDisconnect}
          setIsCallView={setIsCallView}
          sessionId={sessionId}
          handleFirstInteractionAudio={handleFirstInteractionAudio}
        />
      </div>

      <div style={{ width: '100%', display: isCallView ? 'none' : 'flex' }}>
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
    </main>
  );
};

export default Conversation;
