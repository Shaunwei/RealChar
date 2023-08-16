/**
 * src/components/AdvancedOptions/index.jsx
 * Enable various advanced options like google search or quivr second brain
 *
 * created by Lynchee on 7/30/23
 */

import './style.css';
import Button from '@mui/material/Button';
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
import { getHostName } from '../../utils/urlUtils';
import { useCallback, useState } from 'react';
import { TextField } from '@mui/material';

const updateQuivrInfo = async (token, quivrApiKey, quivrBrainId) => {
  const scheme = window.location.protocol;
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
  isLoggedIn,
  token,
  setToken,
  useSearch,
  setUseSearch,
  send,
  useQuivr,
  setUseQuivr,
  quivrApiKey,
  setQuivrApiKey,
  quivrBrainId,
  setQuivrBrainId,
}) => {
  const [openQuivrDialog, setOpenQuivrDialog] = useState(false);

  const handleSearchChange = event => {
    send('[!USE_SEARCH]' + event.target.checked.toString());
    setUseSearch(event.target.checked);
  };

  const updateQuivr = useCallback(async () => {
    try {
      const respone = await updateQuivrInfo(token, quivrApiKey, quivrBrainId);
      if (respone.success) {
        if (useQuivr && quivrApiKey !== '') {
          console.log('Update quivr info successfully: ', respone);
          setQuivrBrainId(respone.brain_id);
        }
      } else {
        console.log("Can't update quivr info");
        setUseQuivr(false);
        setQuivrApiKey('');
        setQuivrBrainId('');
      }
    } catch (error) {
      console.error(error);
      setUseQuivr(false);
      setQuivrApiKey('');
      setQuivrBrainId('');
    }
  }, [
    token,
    useQuivr,
    quivrApiKey,
    quivrBrainId,
    setUseQuivr,
    setQuivrApiKey,
    setQuivrBrainId,
  ]);

  const handleCloseQuivrDialog = useCallback(
    confirm => {
      setOpenQuivrDialog(false);
      if (!confirm || quivrApiKey === '') {
        setUseQuivr(false);
        setQuivrApiKey('');
        setQuivrBrainId('');
      } else {
        updateQuivr();
      }
    },
    [
      updateQuivr,
      quivrApiKey,
      setUseQuivr,
      setQuivrApiKey,
      setQuivrBrainId,
      setOpenQuivrDialog,
    ]
  );

  const handleQuivrChange = useCallback(
    event => {
      setUseQuivr(event.target.checked);
      if (event.target.checked) {
        const fetchQuivrApiKey = async () => {
          if (isLoggedIn.current) {
            const scheme = window.location.protocol;
            const url = scheme + '//' + getHostName() + '/quivr_info';
            const quivrInfoResponse = await fetch(url, {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            });
            const quivrInfo = await quivrInfoResponse.json();
            if (quivrInfo.success) {
              console.log('Get quivr info successfully: ', quivrInfo);
              setQuivrApiKey(quivrInfo.api_key);
              setQuivrBrainId(quivrInfo.brain_id);
            } else {
              console.log("Can't get quivr info");
              setOpenQuivrDialog(true);
            }
          } else {
            setUseQuivr(false);
          }
        };

        if (!isLoggedIn.current || token === '') {
          signInWithGoogle(isLoggedIn, setToken)
            .then(() => {
              fetchQuivrApiKey();
            })
            .catch(() => {
              setUseQuivr(false);
            });
        } else {
          fetchQuivrApiKey();
        }
      } else {
        setQuivrApiKey('');
        setQuivrBrainId('');
      }
    },
    [
      isLoggedIn,
      setToken,
      token,
      setQuivrApiKey,
      setQuivrBrainId,
      setOpenQuivrDialog,
      setUseQuivr,
    ]
  );

  return (
    <>
      <label>Advanced Options</label>
      <div className='advanced-options'>
        <OptionSwitch
          checked={useSearch}
          name={'Enable Google Search'}
          tooltip={
            'Enable the character to access the latest information and online events, but may lead to a slight delay in response time.'
          }
          handleChange={handleSearchChange}
          handleTooltipClick={() => {}}
        />
        <OptionSwitch
          checked={useQuivr}
          name={'Enable Quivr Second Brain'}
          tooltip={
            quivrApiKey != '' && quivrBrainId != '' && useQuivr
              ? `Enable the character to access Quivr second brain, but may lead to a significant delay in response time. Current API Key: ${quivrApiKey} Brain ID: ${quivrBrainId}`
              : 'Enable the character to access Quivr second brain, but may lead to a significant delay in response time.'
          }
          handleChange={handleQuivrChange}
          handleTooltipClick={() => {
            setOpenQuivrDialog(true);
          }}
        />
        <Dialog
          open={openQuivrDialog}
          onClose={() => {
            handleCloseQuivrDialog(false);
          }}
          aria-labelledby='dialog-title'
          fullWidth
          PaperProps={{
            style: {
              backgroundColor: '#050E2E',
              color: 'white',
              borderColor: '#3E496D',
              borderStyle: 'solid',
            },
          }}
        >
          <DialogTitle id='dialog-title'>
            {' '}
            Enter Quivr API Key and Brain ID{' '}
          </DialogTitle>
          <DialogContent>
            <div className='quivr-text-input'>
              <TextField
                value={quivrApiKey}
                variant='outlined'
                sx={{
                  width: '100%',
                  backgroundColor: '#1B2134',
                  borderColor: '#1B2134',
                  '&:hover': {
                    backgroundColor: '#373E58',
                    borderColor: '#A7BFFF',
                  },
                  display: 'flex',
                  justifyContent: 'left',
                  textTransform: 'none',
                }}
                onChange={event => {
                  setQuivrApiKey(event.target.value);
                }}
                placeholder='API Key'
              />
              <TextField
                value={quivrBrainId}
                variant='outlined'
                sx={{
                  width: '100%',
                  backgroundColor: '#1B2134',
                  borderColor: '#1B2134',
                  '&:hover': {
                    backgroundColor: '#373E58',
                    borderColor: '#A7BFFF',
                  },
                  display: 'flex',
                  justifyContent: 'left',
                  textTransform: 'none',
                }}
                onChange={event => {
                  setQuivrBrainId(event.target.value);
                }}
                placeholder='(Optional) Brain ID'
              />
            </div>
          </DialogContent>
          <DialogActions
            sx={{
              justifyContent: 'center',
              marginBottom: 2,
              marginLeft: 2,
              marginRight: 2,
            }}
          >
            <Button
              fullWidth
              variant='contained'
              onClick={() => {
                handleCloseQuivrDialog(true);
              }}
              sx={{ color: 'white', textTransform: 'none' }}
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </>
  );
};

const OptionSwitch = ({
  checked,
  name,
  tooltip,
  handleChange,
  handleTooltipClick,
}) => {
  return (
    <FormControlLabel
      value='start'
      control={
        <Switch
          checked={checked}
          color='primary'
          onChange={handleChange}
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
          {name}
          <CustomTooltip
            title={tooltip}
            placement='top'
            sx={{
              '.MuiTooltip-tooltip': {
                backgroundColor: '#1B1E29',
                color: '#CAC4D0',
              },
            }}
          >
            <IconButton
              aria-label='info'
              sx={{ color: 'white', marginLeft: '5px', padding: '5px' }}
              onClick={handleTooltipClick}
            >
              <InfoOutlinedIcon fontSize='small' />
            </IconButton>
          </CustomTooltip>
        </div>
      }
      labelPlacement='start'
    />
  );
};

export default AdvancedOptions;
