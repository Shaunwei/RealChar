/**
 * src/components/AdvancedOptions/index.jsx
 * Enable various advanced options like google search or quivr second brain
 *
 * created by Lynchee on 7/30/23
 */

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import IconButton from '@mui/material/IconButton';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CustomTooltip from '../Common/CustomTooltip';
import { signInWithGoogle } from '../Auth/SignIn';
import { getHostName, getScheme } from '../../utils/urlUtils';
import { useCallback, useState } from 'react';
import { Button } from '../../components/ui/button';
const updateQuivrInfo = async (token, quivrApiKey, quivrBrainId) => {
  const scheme = getScheme();
  const url = scheme + '//' + getHostName() + '/quivr_info';
  // make a POST request to the URL with body of quivr_api_key and quivr_brain_id
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      quivr_api_key: quivrApiKey,
      quivr_brain_id: quivrBrainId,
    }),
  });

  if (response.ok) {
    const jsonResponse = await response.json();
    return jsonResponse;
  } else {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
};

const AdvancedOptions = ({
  useSearch,
  setUseSearch,
  useEchoCancellation,
  setUseEchoCancellation,
}) => {
  const [openQuivrDialog, setOpenQuivrDialog] = useState(false);

  const handleSearchChange = checked => {
    setUseSearch(!checked);
  };

  const handleEchoCanellationChange = checked => {
    setUseEchoCancellation(!checked);
  };

  return (
    <div className='space-y-2'>
      <label>Advanced Options</label>
      <div className='grid grid-cols-2 lg:gap-20 gap-5'>
        <Button
          className='w-full'
          onClick={() => {
            handleEchoCanellationChange(useEchoCancellation);
          }}
          variant={useEchoCancellation ? 'default' : 'secondary'}
        >
          Open Speakers
        </Button>
        <Button
          className='w-full'
          onClick={() => {
            handleSearchChange(useSearch);
          }}
          variant={useSearch ? 'default' : 'secondary'}
        >
          Enable Google Search
        </Button>
      </div>
    </div>
  );
};

export default AdvancedOptions;
