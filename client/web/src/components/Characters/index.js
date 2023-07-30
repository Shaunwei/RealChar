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
    const handleCharacterSelection = (e) => {
        setSelectedCharacter(e.currentTarget.value);
    };

    return (
        <Grid container spacing={2} sx={{ marginBottom: 5}} className="main-container">
            {characterGroups.map(character => (
                (!characterConfirmed || character.character_id === selectedCharacter) && (
                <Grid item xs={6}>
                    <Button 
                        value={character.character_id}
                        variant="outlined" 
                        onClick={handleCharacterSelection} 
                        sx={{ 
                            width: "100%", 
                            backgroundColor: character.character_id === selectedCharacter ? "#35394A" : "#1B2134",
                            borderColor: character.character_id === selectedCharacter ? "#A7BFFF" : "#1B2134",
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
