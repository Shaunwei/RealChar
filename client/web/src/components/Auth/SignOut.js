/**
 * src/components/Auth/SignOut.jsx
 * sign out
 * 
 * created by Lynchee on 7/20/23
 */

import React from 'react';
import auth from '../../utils/firebase';
import { signOut } from "firebase/auth";

const SignOut = ({ isLoggedIn }) => {

  const signout = async (e) => {
    e.preventDefault();

    signOut(auth).then(() => {
      console.log("Sign-out successful.");
      isLoggedIn.current = false;
    }).catch((error) => {
      console.log(`Sign-out failed: ${error.message}`);
    });
  }

  return (
    <form onSubmit={signout}>
      <button type="submit">Sign out</button>
    </form>
  )
}

export default SignOut;
