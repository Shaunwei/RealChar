/**
 * src/pages/Settings.jsx
 *
 * created by Lynchee on 7/28/23
 */

// TODO: user can access this page only if isConnected.current and selectedCharacter

import React, { useState, useEffect } from 'react';
import Languages from '../components/Languages';
import MediaDevices from '../components/MediaDevices';
import Models from '../components/Models';
import Button from '@mui/material/Button';
import { useNavigate, useLocation } from 'react-router-dom';
import queryString from 'query-string';
import './styles.css';
import CommunicationMethod from '../components/CommunicationMethod';
import AdvancedOptions from '../components/AdvancedOptions';
import lz from 'lz-string';

const Settings = ({
  setSelectedCharacter,
  isMobile,
  preferredLanguage,
  setPreferredLanguage,
  selectedDevice,
  setSelectedDevice,
  selectedModel,
  setSelectedModel,
  isLoggedIn,
  token,
  setToken,
  useSearch,
  setUseSearch,
  useQuivr,
  setUseQuivr,
  quivrApiKey,
  setQuivrApiKey,
  quivrBrainId,
  setQuivrBrainId,
  useMultiOn,
  setUseMultiOn,
  useEchoCancellation,
  setUseEchoCancellation,
  send,
  connect,
  setIsCallView,
  shouldPlayAudio,
}) => {
  const navigate = useNavigate();
  const [commMethod, setCommMethod] = useState('Text');

  const { search } = useLocation();
  const { character = '' } = queryString.parse(search);

  useEffect(() => {
    const selectedCharacter = JSON.parse(
      lz.decompressFromEncodedURIComponent(character)
    );
    setSelectedCharacter(selectedCharacter);

    if (!selectedCharacter) {
      navigate('/');
    }
  }, [setSelectedCharacter, character, navigate]);

  const handleStartClick = async () => {
    await connect();

    // TODO(UI): Show loading animation

    const interval = setInterval(() => {
      // display callview
      setIsCallView(commMethod === 'Call');

      shouldPlayAudio.current = true;
      clearInterval(interval);

      // TODO(UI): Hide loading animation
    }, 500);

    navigate(
      '/conversation?isCallViewParam=' +
        (commMethod === 'Call') +
        '&character=' +
        character +
        '&preferredLanguage=' +
        preferredLanguage +
        '&selectedDevice=' +
        (selectedDevice || 'default') +
        '&selectedModel=' +
        selectedModel +
        '&useSearchParam=' +
        useSearch +
        '&useMultiOnParam=' +
        useMultiOn +
        '&useEchoCancellationParam=' +
        useEchoCancellation
    );
  };

  return (
    <div className='settings'>
      <h2 className='center'>Confirm your setting</h2>

      <CommunicationMethod
        commMethod={commMethod}
        setCommMethod={setCommMethod}
      />

      <Languages
        preferredLanguage={preferredLanguage}
        setPreferredLanguage={setPreferredLanguage}
      />

      <MediaDevices
        selectedDevice={selectedDevice}
        setSelectedDevice={setSelectedDevice}
      />

      <Models
        isMobile={isMobile}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
      />

      <AdvancedOptions
        isLoggedIn={isLoggedIn}
        token={token}
        setToken={setToken}
        useSearch={useSearch}
        setUseSearch={setUseSearch}
        useQuivr={useQuivr}
        setUseQuivr={setUseQuivr}
        quivrApiKey={quivrApiKey}
        setQuivrApiKey={setQuivrApiKey}
        quivrBrainId={quivrBrainId}
        setQuivrBrainId={setQuivrBrainId}
        useMultiOn={useMultiOn}
        setUseMultiOn={setUseMultiOn}
        useEchoCancellation={useEchoCancellation}
        setUseEchoCancellation={setUseEchoCancellation}
        send={send}
      />

      <Button
        variant='contained'
        onClick={handleStartClick}
        fullWidth
        size='large'
        sx={{
          textTransform: 'none',
        }}
      >
        Get Started
      </Button>
    </div>
  );
};

export default Settings;
