/**
 * src/components/Models/index.jsx
 * Select a model: gpt3.5, gpt4, or claude
 * 
 * created by Lynchee on 7/20/23
 */

import React from 'react';
import './style.css'
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';

const Models = ({isMobile, selectedModel, setSelectedModel}) => {
    const models = [
        {
            id: "gpt-3.5-turbo-16k",
            name: "GPT-3.5"
        },
        {
            id: "gpt-4",
            name: "GPT-4"
        },
        {
            id: "claude-2",
            name: "Claude-2"
        },
    ]

    const handleModelSelect = (e) => {
        console.log(e.currentTarget.value);
        setSelectedModel(e.currentTarget.value);
    }
    return (
        <>
            <label>Large langauge model(LLM)</label>
            <Grid container spacing={2} sx={{ marginBottom: 5}}>
                {models.map( model => (
                    <Grid item xs={isMobile ? 12 : 4}>
                    <Button 
                        value={model.id} 
                        variant="outlined" 
                        onClick={handleModelSelect}
                        sx={{ 
                            width: "100%", 
                            backgroundColor: model.id === selectedModel ? "#35394A" : "#1B2134",
                            borderColor: model.id === selectedModel ? "#A7BFFF" : "#1B2134",
                            '&:hover': {
                                backgroundColor: "#35394A",
                                borderColor: "#617CC2",
                            },
                            textTransform: 'none',
                            color: 'white'
                        }}
                    >
                        {model.name}
                    </Button>
                    </Grid>
                ))}
            </Grid>
        </>
    )
}

export default Models;
