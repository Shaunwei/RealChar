/**
 * src/components/Common/CustomTooltip.jsx
 * Styled Tooltip
 * 
 * created by Lynchee on 7/30/23
 */

import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';

const CustomTooltip = styled(({ className, ...props }) => (
    <Tooltip {...props} classes={{ popper: className }} />
  ))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: '#1B1E29',
      color: '#CAC4D0',
      fontSize: 14,
      padding: 10,
    },
    }));

export default CustomTooltip;