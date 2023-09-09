import React, { useState, useEffect } from 'react';
import MediaDevices from '../components/MediaDevices';
import Models from '../components/Models';
import { useNavigate, useLocation } from 'react-router-dom';
import queryString from 'query-string';
import CommunicationMethod from '../components/CommunicationMethod';
import AdvancedOptions from '../components/AdvancedOptions';
import lz from 'lz-string';
import { Button } from '../components/ui/button';

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
        '&preferredLanguage=English' +
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
    <main className='p-8 mx-auto max-w-7xl w-full relative'>
      <>
        <div className='flex items-center'>
          <h2 className='mr-2 text-3xl font-bold tracking-tight mb-5'>
            Settings
          </h2>
        </div>
        <div className='space-y-6'>
          <CommunicationMethod
            commMethod={commMethod}
            setCommMethod={setCommMethod}
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
            useSearch={useSearch}
            setUseSearch={setUseSearch}
            useEchoCancellation={useEchoCancellation}
            setUseEchoCancellation={setUseEchoCancellation}
          />
          <Button onClick={handleStartClick} className='w-[150px]'>
            Proceed to chat
          </Button>
        </div>
      </>
    </main>
  );
};

export default Settings;
