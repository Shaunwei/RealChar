/**
 * src/components/Auth/SignOut.jsx
 * sign out
 * 
 * created by Lynchee on 7/20/23
 */

import React from 'react';
import auth from '../../utils/firebase';
import { signOut } from "firebase/auth";
import IconButton from '@mui/material/IconButton';
import LogoutIcon from '@mui/icons-material/Logout';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import './styles.css';

const SignOut = ({ isLoggedIn, user, handleDisconnect }) => {
  const [anchorElUser, setAnchorElUser] = React.useState(null);

  const signout = async () => {
    signOut(auth).then(() => {
      console.log("Sign-out successful.");
      isLoggedIn.current = false;
    }).catch((error) => {
      console.log(`Sign-out failed: ${error.message}`);
    });

    handleDisconnect();
  }

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleSignout = async () => {
    await signout();
    setAnchorElUser(null);
  }

  return (
    <div>
      <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
        <Avatar alt={user.displayName} src={user.photoURL} />
      </IconButton>
      <Menu
          sx={{ mt: '45px'}}
          id="menu-appbar"
          anchorEl={anchorElUser}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorElUser)}
          onClose={handleCloseUserMenu}
          classes={{paper: 'menu-paper'}} 
        >
          <MenuItem className='menu-text' onClick={handleSignout}>
            <LogoutIcon />
            <Typography textAlign="center">Log out</Typography>
          </MenuItem>
        </Menu>
      </div>
  )
}

export default SignOut;
