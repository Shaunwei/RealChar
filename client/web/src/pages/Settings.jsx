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
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

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
  uploadFileResult,
  setUploadFileResult,
  interview,
}) => {
  const navigate = useNavigate();
  const [commMethod, setCommMethod] = useState('Call');

  const { search } = useLocation();
  const { character = '' } = queryString.parse(search);
  const url = 'http://localhost:8089/web.php';

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
        useEchoCancellation +
        '&uploadFileResult=' +
        uploadFileResult
    );
  };

  const onDrop = async acceptedFiles => {
    // 使用FormData来封装文件数据
    const formData = new FormData();
    acceptedFiles.forEach(file => {
      formData.append('file', file);
    });

    try {
      // const url = 'http://localhost:8089/web.php';
      // url = ''
      // 发起上传请求
      const response = await axios.post(url + '/uploadresume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: progressEvent => {
          // 上传进度回调
          const progress = Math.round(
            (progressEvent.loaded / progressEvent.total) * 100
          );
          console.log(`Upload Progress: ${progress}%`);
        },
      });

      const value = response.data;
      console.log('response:', value);
      // 上传成功后更新已上传文件列表
      setUploadFileResult(value);
      console.log('Upload Successful!');
    } catch (error) {
      console.error('Upload Error:', error);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className='settings'>
      <h2 className='center'>设置</h2>

      {/*<CommunicationMethod
        commMethod={commMethod}
        setCommMethod={setCommMethod}
      />*/}

      <Languages
        preferredLanguage={preferredLanguage}
        setPreferredLanguage={setPreferredLanguage}
      />

      <MediaDevices
        selectedDevice={selectedDevice}
        setSelectedDevice={setSelectedDevice}
      />

      {/*<Models*/}
      {/*  isMobile={isMobile}*/}
      {/*  selectedModel={selectedModel}*/}
      {/*  setSelectedModel={setSelectedModel}*/}
      {/*/>*/}

      {/*<AdvancedOptions*/}
      {/*  isLoggedIn={isLoggedIn}*/}
      {/*  token={token}*/}
      {/*  setToken={setToken}*/}
      {/*  useSearch={useSearch}*/}
      {/*  setUseSearch={setUseSearch}*/}
      {/*  useQuivr={useQuivr}*/}
      {/*  setUseQuivr={setUseQuivr}*/}
      {/*  quivrApiKey={quivrApiKey}*/}
      {/*  setQuivrApiKey={setQuivrApiKey}*/}
      {/*  quivrBrainId={quivrBrainId}*/}
      {/*  setQuivrBrainId={setQuivrBrainId}*/}
      {/*  useMultiOn={useMultiOn}*/}
      {/*  setUseMultiOn={setUseMultiOn}*/}
      {/*  useEchoCancellation={useEchoCancellation}*/}
      {/*  setUseEchoCancellation={setUseEchoCancellation}*/}
      {/*  send={send}*/}
      {/*/>*/}
      {interview ? (
        <>
          <div {...getRootProps()} className='dropzone'>
            <input {...getInputProps()} />
            {isDragActive ? (
              <p>拖放文件到此处以上传</p>
            ) : (
              <div>
                将文件拖到此处，或
                <em>点击上传</em>
              </div>
            )}
          </div>
        </>
      ) : (
        <></>
      )}
      <Button
        variant='contained'
        onClick={handleStartClick}
        fullWidth
        size='large'
        sx={{
          textTransform: 'none',
        }}
      >
        开始
      </Button>
    </div>
  );
};

export default Settings;
