/**
 * src/pages/Home.jsx
 * 
 * created by Lynchee on 7/28/23
 */

import React, { useState, useRef, useEffect } from 'react';
import {isIP} from 'is-ip';
import { useNavigate } from 'react-router-dom';

import Characters from '../components/Characters';
import Button from '@mui/material/Button';

const Home = ({ 
  isMobile,
  selectedCharacter, 
  setSelectedCharacter, 
  isPlaying,
  characterGroups,
  setCharacterGroups,
  setCharacterConfirmed,
  characterConfirmed
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Get characters
  useEffect(() => {
    setLoading(true);

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
      .then(data => {
        setCharacterGroups(data);
        setLoading(false);
      }).catch(err => {
        setLoading(false);
        console.error(err);
      });
  }, [])

  const handleNextClick = () => {
    setCharacterConfirmed(true);
    navigate("/settings"); 
  }

  return (
    <div className="home">
      { loading ? (<h2>Loading...</h2>) : (
        <>
          <p className="header">Choose Your Partner</p>
  
          <Characters 
              isMobile={isMobile}
              characterGroups={characterGroups} 
              selectedCharacter={selectedCharacter} 
              setSelectedCharacter={setSelectedCharacter} 
              isPlaying={isPlaying} 
              characterConfirmed={characterConfirmed} 
          />

          <Button
            variant="contained"
            onClick={handleNextClick} 
            fullWidth 
            size='large'
            disabled={!selectedCharacter}
            sx={{
              '&.Mui-disabled': {
                backgroundColor: '#BEC5D9',
                color: '#636A84',
              },
              textTransform: 'none'
            }}
          >
              Next
          </Button>
          </>)}
      </div>
  )
};

export default Home;
