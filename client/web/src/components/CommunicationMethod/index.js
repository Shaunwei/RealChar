/**
 * src/components/CommunicationMethod/index.jsx
 * Select call or text
 *
 * created by Lynchee on 7/30/23
 */

import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CustomTooltip from '../Common/CustomTooltip';
import './style.css';

const CommunicationMethod = ({ commMethod, setCommMethod }) => {
  const communication = ['Text', 'Call'];

  const handleCommMethodChange = event => {
    setCommMethod(event.target.value);
  };

  const isUnsupportedBrowser =
    window.navigator.userAgent.indexOf('Edg') !== -1 ||
    window.navigator.userAgent.indexOf('Firefox') !== -1;

  return (
    <>
      <div
        className='title'
        style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}
      >
        <span>Chat Mode</span>
        <CustomTooltip
          title='You can change the Chat Mode during your conversation. Call is currently only available for Chrome and Safari Browsers.'
          placement='top'
        >
          <IconButton
            aria-label='info'
            sx={{ color: 'white', marginLeft: '5px', padding: '5px' }}
          >
            <InfoOutlinedIcon fontSize='small' />
          </IconButton>
        </CustomTooltip>
      </div>
      <Grid container spacing={2} sx={{ marginBottom: 5 }}>
        {communication.map((method, index) => (
          <Grid item xs={6} key={index}>
            <Button
              value={method}
              variant='outlined'
              onClick={handleCommMethodChange}
              disabled={isUnsupportedBrowser && method === 'Call'}
              sx={{
                width: '100%',
                backgroundColor: method === commMethod ? '#d5dae9' : '#d5dae9',
                borderColor: method === commMethod ? '#A7BFFF' : '#d5dae9',
                '&:hover': {
                  backgroundColor: '#92B3FAFF',
                  borderColor: '#617CC2',
                },
                textTransform: 'none',
                color: 'white',
              }}
            >
              {method}
            </Button>
          </Grid>
        ))}
      </Grid>
    </>
  );
};

export default CommunicationMethod;
