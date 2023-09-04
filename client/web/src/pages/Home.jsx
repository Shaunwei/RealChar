/**
 * src/pages/Home.jsx
 *
 * created by Lynchee on 7/28/23
 */

import React, { useState, useRef, useEffect } from 'react';
import { isIP } from 'is-ip';
import { useNavigate } from 'react-router-dom';
import lz from 'lz-string';

import Characters from '../components/Characters';
import Button from '@mui/material/Button';
import { getHostName, getScheme } from '../utils/urlUtils';
import { signInWithGoogle } from '../components/Auth/SignIn';

const Home = ({
  isMobile,
  selectedCharacter,
  setSelectedCharacter,
  isPlaying,
  characterGroups,
  setCharacterGroups,
  setCharacterConfirmed,
  characterConfirmed,
  token,
  setToken,
  isLoggedIn,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Get characters
  useEffect(() => {
    setLoading(true);

    // Get host
    const scheme = getScheme();
    const url = scheme + '//' + getHostName() + '/characters';
    let headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    fetch(url, {
      method: 'GET',
      headers: headers,
    })
      .then(response => response.json())
      .then(data => {
        setCharacterGroups(data);
        setLoading(false);
      })
      .catch(err => {
        setLoading(false);
        console.error(err);
      });
  }, [setCharacterGroups, token]);

  const handleNextClick = () => {
    setCharacterConfirmed(true);
    const compressedCharacter = lz.compressToEncodedURIComponent(
      JSON.stringify(selectedCharacter)
    );
    navigate('/settings?character=' + compressedCharacter);
  };

  const handleCreateCharacter = () => {
    if (!isLoggedIn.current) {
      signInWithGoogle(isLoggedIn, setToken).then(() => {
        if (isLoggedIn.current) {
          navigate('/create');
        }
      });
    } else {
      navigate('/create');
    }
  };

  return (
    <div className='home'>
      {loading ? (
        <h2>Loading...</h2>
      ) : (
        <>
          <p className='header'>Choose Your Partner</p>

          <Characters
            isMobile={isMobile}
            characterGroups={characterGroups}
            selectedCharacter={selectedCharacter}
            setSelectedCharacter={setSelectedCharacter}
            isPlaying={isPlaying}
            characterConfirmed={characterConfirmed}
          />
          <Button
            variant='contained'
            color='primary'
            onClick={handleCreateCharacter}
            sx={{ marginBottom: '20px' }}
          >
            Create Your Character
          </Button>

          <Button
            variant='contained'
            onClick={handleNextClick}
            fullWidth
            size='large'
            disabled={!selectedCharacter}
            sx={{
              '&.Mui-disabled': {
                backgroundColor: '#BEC5D9',
                color: '#636A84',
              },
              textTransform: 'none',
            }}
          >
            Next
          </Button>
        </>
      )}
    </div>
  );
};

export default Home;
