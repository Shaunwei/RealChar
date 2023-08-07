/**
 * src/components/Header/index.jsx
 * logo
 *
 * created by Lynchee on 7/16/23
 */

import React from 'react';
import logo from '../../assets/svgs/logo.svg';
import './style.css';
import SignIn from '../Auth/SignIn';
import SignOut from '../Auth/SignOut';
import { Navbar } from '@nextui-org/react';

const Header = ({ user, isLoggedIn, setToken, handleDisconnect }) => (
  <Navbar id='navbar' variant='floating'>
    <a href='/'>
      <Navbar.Brand
        css={{
          '@xs': {
            w: '12%',
          },
        }}
      >
        <img src={logo} alt='Logo' />
      </Navbar.Brand>
    </a>

    <Navbar.Content
      id='navbar'
      css={{
        '@xs': {
          w: '19%',
          jc: 'flex-end',
        },
      }}
    >
      {user ? (
        <SignOut
          isLoggedIn={isLoggedIn}
          user={user}
          handleDisconnect={handleDisconnect}
        />
      ) : (
        <SignIn isLoggedIn={isLoggedIn} setToken={setToken} />
      )}
    </Navbar.Content>
  </Navbar>
);

export default Header;
