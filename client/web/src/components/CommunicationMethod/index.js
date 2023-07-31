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
    
    const communication = ["Text", "Call"];

    const handleCommMethodChange = (event) => {
        setCommMethod(event.target.value);
    };

    return (
        <>
        <div className="title" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <span>Communication method</span>
            <CustomTooltip title="You can change the communication method during your conversation." placement="top">
                <IconButton 
                    aria-label="info"
                    sx={{ color: 'white', marginLeft: '5px', padding: '5px' }}
                >
                    <InfoOutlinedIcon fontSize="small" />
                </IconButton>
            </CustomTooltip>
        </div>
        <Grid container spacing={2} sx={{ marginBottom: 5 }}>  
            {communication.map( method => (
                <Grid item xs={6}>
                <Button
                    value={method} 
                    variant="outlined" 
                    onClick={handleCommMethodChange}
                    sx={{ 
                        width: "100%", 
                        backgroundColor: method === commMethod ? "#35394A" : "#1B2134",
                        borderColor: method === commMethod ? "#A7BFFF" : "#1B2134",
                        '&:hover': {
                            backgroundColor: "#35394A",
                            borderColor: "#617CC2",
                        },
                        textTransform: 'none',
                        color: 'white'
                    }}
                >
                    {method}
                </Button>
                </Grid>
            ))}
        </Grid>
        </>
    )
}


export default CommunicationMethod;