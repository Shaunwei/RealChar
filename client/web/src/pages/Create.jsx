/*
 * Create.jsx
 *
 * created by kivinju on Sat Aug 05 2023
 */

import React from 'react';

import { Avatar } from '@mui/material';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import './styles.css';

const Create = theme => {
  return (
    <div>
      <h1 className='center'>Create a Character</h1>
      <Avatar
        sx={{
          width: 100,
          height: 100,
          margin: 'auto',
        }}
        variant='rounded'
        justifyContent='center'
      >
        <EmojiEmotionsIcon sx={{ width: 80, height: 80 }} />
      </Avatar>
      <p className='center'>Upload an avartar</p>
    </div>
  );
};

export default Create;
