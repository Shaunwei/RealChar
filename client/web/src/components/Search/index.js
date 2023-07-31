/**
 * src/components/Search/index.jsx
 * Enable google search
 * 
 * created by Lynchee on 7/30/23
 */

import './style.css';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import IconButton from '@mui/material/IconButton';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CustomTooltip from '../Common/CustomTooltip';


const Search = ({ setUseSearch, send }) => {
    const handleSearchChange = (event) => {
        send('[!USE_SEARCH]' + (event.target.checked).toString());
        setUseSearch(event.target.checked);
    };

    return (
        <>
        <label >Advanced Options</label>
        <div className='search'>
            <FormControlLabel
              value="start"
              control={
                <Switch 
                  color="primary" 
                  onChange={handleSearchChange}
                  sx={{ 
                    '& .MuiSwitch-track': {
                      backgroundColor: '#626983',
                    },
                    '& .Mui-checked': {
                      color: '#626983',
                    },
                    '& .Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#626983',
                    },
                  }}
                />
              }
              label={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  "Enable Google Search"
                  <CustomTooltip 
                    title="Enable the character to access the latest information and online events, but may lead to a slight delay in response time." 
                    placement="top"
                    sx={{ 
                      '.MuiTooltip-tooltip': {
                        backgroundColor: '#1B1E29',
                        color: '#CAC4D0',
                      }
                    }}
                  >
                    <IconButton 
                        aria-label="info"
                        sx={{ color: 'white', marginLeft: '5px', padding: '5px' }}
                    >
                        <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </CustomTooltip>
                </div>
              }
              labelPlacement="start"
            />
        </div>
        </>
    );
};

export default Search;
