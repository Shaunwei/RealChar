/**
 * src/components/Characters/index.jsx
 * create and display characters
 *
 * created by Lynchee on 7/16/23
 */

// Characters
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import lz from 'lz-string';
import { Card, CardHeader, CardTitle } from '../../components/ui/card';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../../components/ui/avatar';

const Characters = ({
  characterGroups,
  selectedCharacter,
  setSelectedCharacter,
  characterConfirmed,
}) => {
  const navigate = useNavigate();
  const handleCharacterSelection = character => {
    setSelectedCharacter(character);
    const compressedCharacter = lz.compressToEncodedURIComponent(
      JSON.stringify(character)
    );
    navigate('/settings?character=' + compressedCharacter);
  };

  return (
    <div className='grid gap-4 mt-4 md:grid-cols-2'>
      {characterGroups.map(
        (character, index) =>
          ((!characterConfirmed && character.source === 'default') ||
            (selectedCharacter &&
              character.character_id === selectedCharacter.character_id)) && (
            <Card
              className='w-full hover:cursor-pointer'
              key={index}
              onClick={() => handleCharacterSelection(character)}
            >
              <CardHeader className='flex justify-center items-center mx-auto'>
                <Avatar className='w-48 h-48'>
                  <AvatarImage src={character.image_url} alt={character.name} />
                  <AvatarFallback>{character.name}</AvatarFallback>
                </Avatar>
                <CardTitle>{character.name}</CardTitle>
              </CardHeader>
            </Card>
          )
      )}
    </div>
  );
};

export default Characters;
