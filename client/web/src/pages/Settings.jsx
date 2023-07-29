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
import Button from '../components/Common/Button';
import { useNavigate } from 'react-router-dom';
import './styles.css';

const Settings = ({ preferredLanguage, setPreferredLanguage, selectedDevice, setSelectedDevice, selectedModel, setSelectedModel, useSearch, setUseSearch, send, connect, setIsCallView, shouldPlayAudio}) => {
    const navigate = useNavigate();
    const [commMethod, setCommMethod] = useState("text");

    const handleStartClick = async () => {
        await connect();

        // TODO(UI): Show loading animation

        const interval = setInterval(() => {
            // display callview
            setIsCallView(commMethod === "call");
    
            shouldPlayAudio.current = true;
            clearInterval(interval);

            // TODO(UI): Hide loading animation
        }, 500);

        navigate("/conversation");
    }

    const handleSearchChange = () => {
        send('[!USE_SEARCH]' + (!useSearch).toString());
        setUseSearch(!useSearch);
    };

    const handleCommMethodChange = (event) => {
        setCommMethod(event.target.value);
    };

    return (
        <div className='settings'>
            <h2>Confirm your setting</h2>
            
            <div className="comm-container">
                <label className="comm-label" htmlFor="comm-selection">Communication method</label>
                <div id="comm-selection" className="select-dropdown">
                    <select value={commMethod} onChange={handleCommMethodChange}>
                        <option disabled value="">Select Language</option>
                        <option value="call">Call</option>
                        <option value="text">Text</option>
                    </select>
                </div>
            </div>

            <Languages preferredLanguage={preferredLanguage} setPreferredLanguage={setPreferredLanguage} />
            
            <MediaDevices selectedDevice={selectedDevice} setSelectedDevice={setSelectedDevice} />
            
            <Models selectedModel={selectedModel} setSelectedModel={setSelectedModel} />

            <label className='search-checkbox'>
                <input
                type="checkbox"
                checked={useSearch}
                onChange={handleSearchChange}
                />
                Enable Google Search
            </label>

            <div className='start-btn'>
                <Button onClick={handleStartClick} name="Get Started"/>
            </div>
        </div>
    );
};

export default Settings;
