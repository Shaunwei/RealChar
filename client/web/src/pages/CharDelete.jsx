/**
 * src/pages/CharDelete.jsx
 *
 * created by pycui on 8/11/23
 */

import React, { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import { deleteCharacter } from '../utils/apiUtils';
import { useNavigate } from 'react-router-dom';
import Characters from '../components/Characters';

const CharDelete = ({ token, isMobile, characterGroups }) => {
  const navigate = useNavigate();

  const [selectedCharacter, setSelectedCharacter] = useState(null);
  useEffect(() => {
    if (characterGroups.length == 0) {
      navigate('/');
    }
  }, [characterGroups]);

  const handleSubmit = async event => {
    event.preventDefault();
    if (!selectedCharacter) {
      alert('Please select a character');
      return;
    }
    if (selectedCharacter.source === 'default') {
      alert('Cannot delete default character');
      return;
    }
    const character_id = selectedCharacter.character_id;
    console.log(character_id);

    // call api to delete character
    try {
      await deleteCharacter(character_id, token);
      navigate('/');
    } catch (error) {
      console.error(error);
      alert(
        'Error deleting character. You may only delete characters that you created.'
      );
    }
  };

  return (
    <div className='home'>
      <h1>Delete your character</h1>
      <Characters
        isMobile={isMobile}
        characterGroups={characterGroups}
        isPlaying={false}
        characterConfirmed={false}
        selectedCharacter={selectedCharacter}
        setSelectedCharacter={setSelectedCharacter}
      />
      <Button variant='contained' color='primary' onClick={handleSubmit}>
        Delete
      </Button>
      <div>
        <p>It may take 30 seconds for the change to be effective.</p>
      </div>
    </div>
  );
};

export default CharDelete;
