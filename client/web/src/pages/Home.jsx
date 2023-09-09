/**
 * src/pages/Home.jsx
 *
 * created by Lynchee on 7/28/23
 */

import React, { useState, useRef, useEffect } from 'react';

import Characters from '../components/Characters';
import { getHostName, getScheme } from '../utils/urlUtils';

const Home = ({
  selectedCharacter,
  setSelectedCharacter,
  isPlaying,
  characterGroups,
  setCharacterGroups,
  characterConfirmed,
  token,
}) => {
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

  return (
    <main className='p-8 mx-auto max-w-7xl w-full'>
      <div>
        {loading ? (
          <h2>Loading...</h2>
        ) : (
          <>
            <div className='flex items-center'>
              <h2 className='mr-2 text-3xl font-bold tracking-tight'>
                Dashboard
              </h2>
            </div>
            <Characters
              characterGroups={characterGroups}
              selectedCharacter={selectedCharacter}
              setSelectedCharacter={setSelectedCharacter}
              isPlaying={isPlaying}
              characterConfirmed={characterConfirmed}
            />
          </>
        )}
      </div>
    </main>
  );
};

export default Home;
