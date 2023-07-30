/**
 * src/components/Search/index.jsx
 * Enable google search
 * 
 * created by Lynchee on 7/30/23
 */

import './style.css';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

const Search = ({ useSearch, setUseSearch, send }) => {
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
              label="Enable Google Search"
              labelPlacement="start"
            />
        </div>
        </>
    );
};

export default Search;
