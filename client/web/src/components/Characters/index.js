/**
 * src/components/Characters/index.jsx
 * create and display characters
 * 
 * created by Lynchee on 7/16/23
 */

// Characters
import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import GroupsIcon from '@mui/icons-material/Groups';
import './style.css';

const Characters = ({ isMobile, characterGroups, selectedCharacter, setSelectedCharacter, isPlaying, characterConfirmed }) => {
    const [openDialog, setOpenDialog] = useState(false);
    
    const handleCharacterSelection = (character) => {
        setSelectedCharacter(character);
    };

    const handleOpenDialog = () => {
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    return (
        <Grid container spacing={2} sx={{ marginBottom: 5}} className="main-container">
            {characterGroups.map(character => (
                ((!characterConfirmed && character.source === "default") || (selectedCharacter && character.character_id === selectedCharacter.character_id)) && (
                <Grid item xs={isMobile ? 12 : 6}>
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

            <Grid item xs={isMobile ? 12 : 6}>
                <Button 
                    variant="outlined" 
                    onClick={handleOpenDialog}
                    sx={{ 
                        width: "100%", 
                        backgroundColor: "#1B2134",
                        borderColor: "#1B2134",
                        '&:hover': {
                            backgroundColor: "#35394A",
                            borderColor: "#617CC2",
                        },
                        display: 'flex',
                        justifyContent: 'left',
                        textTransform: 'none'
                    }}
                >

                    <Avatar sx={{ backgroundColor: 'transparent' }}>
                        <GroupsIcon sx={{ color: 'white'}}/>
                    </Avatar>
                    
                    <Typography 
                        variant="body1" 
                        sx={{
                            color: "white",
                            fontFamily: "Prompt, sans-serif"
                        }}
                    >
                        Select from community
                    </Typography>
                </Button>
            </Grid>

            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                aria-labelledby="dialog-title"
                fullWidth
                PaperProps={{
                    style: { backgroundColor: "#050E2E", color: "white", borderColor: "#3E496D", borderStyle: "solid" },
                }}
            >
                <DialogTitle id="dialog-title"> Select partner from RealChar community </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2}>
                    {characterGroups.map(character => {
                        return character.source === "community" ? (
                            <Grid item xs={isMobile ? 12 : 6}>
                            <Button 
                                variant="outlined" 
                                onClick={() => handleCharacterSelection(character)}
                                sx={{ 
                                    width: "100%", 
                                    backgroundColor: (selectedCharacter && (character.character_id === selectedCharacter.character_id)) ? "#35394A" : "#1B2134",
                                    borderColor: (selectedCharacter && (character.character_id === selectedCharacter.character_id)) ? "#A7BFFF" : "#1B2134", 
                                    '&:hover': {
                                        backgroundColor: "#373E58",
                                        borderColor: "#A7BFFF",
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
                                <div style={{ display: "block", textAlign: "left" }}>
                                    <Typography 
                                        variant="body1" 
                                        sx={{
                                            color: "white",
                                            fontFamily: "Prompt, sans-serif",
                                        }}
                                    >
                                        {character.name}
                                    </Typography>
                                    <Typography 
                                        variant="body1" 
                                        sx={{
                                            color: "#BEC5D9",
                                            fontFamily: "Prompt, sans-serif",
                                            fontStyle: "italic"
                                        }}
                                    >
                                        @{character.author_name}
                                    </Typography>
                                </div>
                            </Button>
                            </Grid>
                        ) : null;
                    })}
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', marginBottom: 2, marginLeft: 2, marginRight: 2}}>
                    <Button fullWidth variant="contained" onClick={handleCloseDialog} sx={{color: "white", textTransform: 'none'}}>Confirm</Button>
                </DialogActions>
            </Dialog>
        </Grid>
    );
};
  
export default Characters;
