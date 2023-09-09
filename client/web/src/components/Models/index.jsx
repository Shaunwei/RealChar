/**
 * src/components/Models/index.jsx
 * Select a model: gpt3.5, gpt4, or claude
 *
 * created by Lynchee on 7/20/23
 */

import React from 'react';
import './style.css';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import CustomTooltip from '../Common/CustomTooltip';
import CheckIcon from '@mui/icons-material/Check';

const Models = ({ isMobile, selectedModel, setSelectedModel }) => {
  const models = [
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5-4k',
      tooltip: 'Most Cost effective GPT-3.5 from OpenAI',
    },
    {
      id: 'gpt-3.5-turbo-16k',
      name: 'GPT-3.5-16k',
      tooltip: 'Fastest model, good for most conversation',
    },
    {
      id: 'gpt-4',
      name: 'GPT-4',
      tooltip: 'Medium speed, most capable model, best conversation experience',
    },
    {
      id: 'claude-2',
      name: 'Claude-2',
      tooltip: 'Slower model, longer context window for long conversation',
    },
    {
      id: 'meta-llama/Llama-2-70b-chat-hf',
      name: 'Llama-2-70b',
      tooltip: 'Open source model, good for most conversation',
    },
    {
      id: 'meta-llama/Llama-2-7b-chat-hf',
      name: 'Llama-2-7b',
      tooltip: 'Cheapest model, good for dev and testing',
    },
  ];

  const CustomTooltipContent = ({ tooltip }) => {
    const parts = tooltip.split(',');
    return (
      <div>
        {parts.map((part, index) => (
          <div
            style={{ display: 'flex', alignItems: 'center', color: '#CAC4D0' }}
            key={index}
          >
            <CheckIcon fontSize='small' sx={{ color: '#CAC4D0' }} />
            <span style={{ marginLeft: '5px' }}>{part.trim()}</span>
          </div>
        ))}
      </div>
    );
  };

  const handleModelSelect = e => {
    setSelectedModel(e.currentTarget.value);
  };
  return (
    <>
      <label>Large language model(LLM)</label>
      <Grid container spacing={2} sx={{ marginBottom: 5 }}>
        {models.map((model, index) => (
          <Grid item xs={isMobile ? 12 : 3} key={index}>
            <CustomTooltip
              title={<CustomTooltipContent tooltip={model.tooltip} />}
              placement='top-end'
            >
              <Button
                value={model.id}
                variant='outlined'
                onClick={handleModelSelect}
                sx={{
                  width: '100%',
                  backgroundColor:
                    model.id === selectedModel ? '#35394A' : '#1B2134',
                  borderColor:
                    model.id === selectedModel ? '#A7BFFF' : '#1B2134',
                  '&:hover': {
                    backgroundColor: '#35394A',
                    borderColor: '#617CC2',
                  },
                  textTransform: 'none',
                  color: 'white',
                }}
              >
                {model.name}
              </Button>
            </CustomTooltip>
          </Grid>
        ))}
      </Grid>
    </>
  );
};

export default Models;
