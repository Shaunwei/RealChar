/**
 * src/pages/Home.jsx
 * 
 * created by Lynchee on 7/28/23
 */

import React, { useState, useRef, useEffect } from 'react';
import {isIP} from 'is-ip';
import { useNavigate } from 'react-router-dom';

import MobileWarning from '../components/MobileWarning';
import Characters from '../components/Characters';
import Button from '../components/Common/Button';

const Home = ({ selectedCharacter, setSelectedCharacter, isPlaying }) => {
  const navigate = useNavigate();
  const isMobile = window.innerWidth <= 768; 
  const [characterGroups, setCharacterGroups] = useState([]);
  const [characterConfirmed, setCharacterConfirmed] = useState(false);

  // Get characters
  useEffect(() => {
    // Get host
    const scheme = window.location.protocol;
    var currentHost = window.location.host;
    var parts = currentHost.split(':');
    var hostname = parts[0];
    // Local deployment uses 8000 port by default.
    var newPort = '8000';

    if (!(hostname === 'localhost' || isIP(hostname))) {
        hostname = 'api.' + hostname;
        newPort = window.location.protocol === "https:" ? 443 : 80;
    }
    var newHost = hostname + ':' + newPort + '/characters';
    const url = scheme + '//' + newHost;

    fetch(url)
      .then(response => response.json())
      .then(data => setCharacterGroups(data))
      .catch(err => console.error(err));
  }, [])

  const handleNextClick = () => {
    setCharacterConfirmed(true);
    navigate("/settings"); 
  }

  return (
    isMobile ? (
        <MobileWarning />
      ) : (
        <div id="desktop-content">
          <p className="header">Choose Your Partner</p>
  
          <Characters 
              characterGroups={characterGroups} 
              selectedCharacter={selectedCharacter} 
              setSelectedCharacter={setSelectedCharacter} 
              isPlaying={isPlaying} 
              characterConfirmed={characterConfirmed} 
          />

          <Button onClick={handleNextClick} name="Next"  disabled={!selectedCharacter}/>
        </div>
      )
    )
};

export default Home;
