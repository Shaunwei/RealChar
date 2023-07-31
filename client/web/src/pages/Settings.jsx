/**
 * src/pages/Settings.jsx
 * 
 * created by Lynchee on 7/28/23
 */

// TODO: user can access this page only if isConnected.current and selectedCharacter

import React, { useState } from 'react';
import Languages from '../components/Languages';
import MediaDevices from '../components/MediaDevices';
import Models from '../components/Models';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';
import './styles.css';
import CommunicationMethod from '../components/CommunicationMethod';
import Search from '../components/Search';

const Settings = ({ isMobile, preferredLanguage, setPreferredLanguage, selectedDevice, setSelectedDevice, selectedModel, setSelectedModel, useSearch, setUseSearch, send, connect, setIsCallView, shouldPlayAudio}) => {
    const navigate = useNavigate();
    const [commMethod, setCommMethod] = useState("Text");

    const handleStartClick = async () => {
        await connect();

        // TODO(UI): Show loading animation

        const interval = setInterval(() => {
            // display callview
            setIsCallView(commMethod === "Call");
    
            shouldPlayAudio.current = true;
            clearInterval(interval);

            // TODO(UI): Hide loading animation
        }, 500);

        navigate("/conversation");
    }

    return (
        <div className='settings'>
            <h2 className="center">Confirm your setting</h2>
            
            <CommunicationMethod commMethod={commMethod} setCommMethod={setCommMethod}/>

            <Languages preferredLanguage={preferredLanguage} setPreferredLanguage={setPreferredLanguage} />
            
            <MediaDevices selectedDevice={selectedDevice} setSelectedDevice={setSelectedDevice} />
            
            <Models isMobile={isMobile} selectedModel={selectedModel} setSelectedModel={setSelectedModel} />

            <Search useSearch={useSearch} setUseSearch={setUseSearch} send={send}/>

            <Button
                variant="contained"
                onClick={handleStartClick} 
                fullWidth 
                size='large'
                sx={{
                  textTransform: 'none'
                }}
              >
                  Get Started
              </Button>
        </div>
    );
};

export default Settings;
