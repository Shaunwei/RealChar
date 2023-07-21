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

const Header = ({ user, isLoggedIn, setToken, handleDisconnect }) => (
  <header>
    <div className="logo-container">
      <img src={logo} alt="Logo" />
    </div>
    <div className="auth-container">
      { user ?
        <SignOut 
          isLoggedIn={isLoggedIn} 
          user={user} 
          handleDisconnect={handleDisconnect} 
        /> : 
        <SignIn 
          isLoggedIn={isLoggedIn}
          setToken={setToken}
        /> }
    </div>
  </header>
);

export default Header;
