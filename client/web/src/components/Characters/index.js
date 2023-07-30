/**
 * src/components/Characters/index.jsx
 * create and display characters
 * 
 * created by Lynchee on 7/16/23
 */

// Characters
// Characters
import React from 'react';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import './style.css';

const Characters = ({ characterGroups, selectedCharacter, setSelectedCharacter, isPlaying, characterConfirmed }) => {
    const handleCharacterSelection = (character) => {
        setSelectedCharacter(character);
    };

    return (
        <Grid container spacing={2} sx={{ marginBottom: 5}} className="main-container">
            {characterGroups.map(character => (
                (!characterConfirmed || character.character_id === selectedCharacter.character_id) && (
                <Grid item xs={6}>
                    <Button 
                        variant="outlined" 
                        onClick={() => handleCharacterSelection(character)}
                        sx={{ 
                            width: "100%", 
                            backgroundColor: (selectedCharacter && (character.character_id === selectedCharacter.character_id)) ? "#35394A" : "#1B2134",
                            borderColor: (selectedCharacter && (character.character_id === selectedCharacter.character_id)) ? "#A7BFFF" : "#1B2134",
                            '&:hover': {
                                backgroundColor: "#35394A",
                                borderColor: "#617CC2",
                            },
                            display: 'flex',
                            justifyContent: 'left',
                            textTransform: 'none'
                        }}
                    >
                        <Avatar 
                            alt={character.name} 
                            src={character.image_url} 
                            sx={{ marginRight: 1 }}
                        />
                        <Typography 
                            variant="body1" 
                            sx={{
                                color: "white",
                                fontFamily: "Prompt, sans-serif"
                            }}
                        >
                            {character.name}
                        </Typography>
                    </Button>
                </Grid>
                )
            ))}
        </Grid>
    );
};
  
export default Characters;
