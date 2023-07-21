/**
 * src/components/Auth/SignOut.jsx
 * sign out
 * 
 * created by Lynchee on 7/20/23
 */

import React from 'react';
import auth from '../../utils/firebase';
import { signOut } from "firebase/auth";
import './styles.css';

const SignOut = ({ isLoggedIn, user, handleDisconnect }) => {

  const signout = async (e) => {
    e.preventDefault();

    signOut(auth).then(() => {
      console.log("Sign-out successful.");
      isLoggedIn.current = false;
    }).catch((error) => {
      console.log(`Sign-out failed: ${error.message}`);
    });

    handleDisconnect();
  }

  return (
    <form onSubmit={signout} className='signout-container'>
      <p className='text-white'>Hello, <span>{user.displayName}</span></p>
      <button type="submit" className='auth-btn'>Sign out</button>
    </form>
  )
}

export default SignOut;
