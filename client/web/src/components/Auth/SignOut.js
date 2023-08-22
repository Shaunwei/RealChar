/**
 * src/components/Auth/SignOut.jsx
 * sign out
 *
 * created by Lynchee on 7/20/23
 */

import React from 'react';
import auth from '../../utils/firebase';
import { signOut } from 'firebase/auth';
import Avatar from '@mui/material/Avatar';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from "@nextui-org/dropdown";

import {

  NavbarContent, 
  NavbarItem, 

} from "@nextui-org/navbar";


import { useNavigate } from 'react-router-dom';
import './styles.css';

const SignOut = ({ isLoggedIn, user, handleDisconnect }) => {
  const navigate = useNavigate();
  const signout = async () => {
    signOut(auth)
      .then(() => {
        console.log('Sign-out successful.');
        isLoggedIn.current = false;
      })
      .catch(error => {
        console.log(`Sign-out failed: ${error.message}`);
      });

    handleDisconnect();
  };

  const handleSignout = async () => {
    await signout();
  };

  const handleDropdownAction = async actionKey => {
    if (actionKey === 'logout') {
      // when a dropdown button is pressed using its "key" ,which we set, we can tell when its pressed , so when the key "logout" is pressed we sign the user out, in the future you can use the key "profile" to navigate the user to his dashboard for example
      await handleSignout();
    } else if (actionKey === 'create') {
      navigate('/create');
    } else if (actionKey === 'delete') {
      navigate('/delete');
    }
  };

  return (
    
      <Dropdown  placement='bottom-right'>
        <NavbarItem>
          {/* This is what triggers user info dropdown */}
          <DropdownTrigger>
            <Avatar
              className='usericon'
              color='warning'
              size='md'
              src={user.photoURL}
              alt={user.displayName}
            />
          </DropdownTrigger>
        </NavbarItem>
        <DropdownMenu 
          className="dropdown-menu"
          aria-label='User menu actions'
          
          onAction={actionKey => handleDropdownAction(actionKey)}>
        <DropdownItem
          
            key='profile'
            css={{
              height: '$18',
              d: 'flex',
            }}
            color="primary"
          >
            Signed in as
            <br />
            {user.email}
          </DropdownItem>
          <DropdownItem key='create'  withDivider color="primary">
            Create a character
          </DropdownItem>
          <DropdownItem key='delete'  withDivider color="primary">
            Delete a character
          </DropdownItem>
            <DropdownItem key="logout" color="danger">
              Log Out
            </DropdownItem>
          </DropdownMenu>
      </Dropdown>
   
  );
};

export default SignOut;
