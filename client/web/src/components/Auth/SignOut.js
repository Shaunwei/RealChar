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
import { Navbar, Dropdown } from '@nextui-org/react';
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
    <Navbar.Content
      css={{
        '@xs': {
          w: '12%',
          jc: 'flex-end',
        },
      }}
    >
      <Dropdown placement='bottom-right'>
        <Navbar.Item>
          {/* This is what triggers user info dropdown */}
          <Dropdown.Trigger>
            <Avatar
              className='usericon'
              color='warning'
              size='md'
              src={user.photoURL}
              alt={user.displayName}
            />
          </Dropdown.Trigger>
        </Navbar.Item>
        <Dropdown.Menu
          aria-label='User menu actions'
          onAction={actionKey => handleDropdownAction(actionKey)}
        >
          {/* This ^ is probably gonna be needed for future features,actionkey tells you what dropdown the user clicked*/}
          <Dropdown.Item
            className='dropdown-item'
            key='profile'
            css={{
              height: '$18',
              d: 'flex',
            }}
          >
            Signed in as
            <br />
            {user.email}
          </Dropdown.Item>
          <Dropdown.Item key='create' className='dropdown-item' withDivider>
            Create a character
          </Dropdown.Item>
          <Dropdown.Item key='delete' className='dropdown-item' withDivider>
            Delete a character
          </Dropdown.Item>
          <Dropdown.Item
            key='logout'
            className='dropdown-logout'
            withDivider
            color='warning'
          >
            Log Out
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </Navbar.Content>
  );
};

export default SignOut;
