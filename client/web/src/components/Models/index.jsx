/**
 * src/components/Models/index.jsx
 * Select a model: gpt3.5, gpt4, or claude
 *
 * created by Lynchee on 7/20/23
 */

import React from 'react';
import { Button } from '../../components/ui/button';
import Grid from '@mui/material/Grid';
import CustomTooltip from '../Common/CustomTooltip';
import CheckIcon from '@mui/icons-material/Check';

const Models = ({ isMobile, selectedModel, setSelectedModel }) => {
  const models = [
    {
      id: 'gpt-3.5-turbo-16k',
      name: 'GPT-3.5',
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

  const handleModelSelect = value => {
    setSelectedModel(value);
  };
  return (
    <div className='space-y-2'>
      <label>Large language model(LLM)</label>
      <div className='grid lg:grid-cols-4 grid-cols-2 gap-3 lg:gap-20'>
        {models.map((model, index) => (
          <div key={index}>
            <CustomTooltip
              title={<CustomTooltipContent tooltip={model.tooltip} />}
              placement='top-end'
            >
              <Button
                className='w-full'
                onClick={() => handleModelSelect(model.id)}
                variant={selectedModel === model.id ? 'default' : 'secondary'}
              >
                {model.name}
              </Button>
            </CustomTooltip>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Models;
