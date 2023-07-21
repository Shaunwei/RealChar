/**
 * src/components/Auth/SignIn.jsx
 * signin and signup with google account
 * 
 * created by Lynchee on 7/20/23
 */

import React, { useState } from 'react';
import auth from '../../utils/firebase';
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";


const SignIn = ({ setIsLoggedIn }) => {
  console.log("signin");
  const signIn = async (e) => {
    e.preventDefault();

    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then((result) => {
        // This gives you a Google Access Token. You can use it to access the Google API.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        // The signed-in user info.
        const user = result.user;
        console.log(user);
        // IdP data available using getAdditionalUserInfo(result)
        // ...
        setIsLoggedIn(true);
      }).catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        // The email of the user's account used.
        const email = error.customData.email;
        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);
        // ...
        setIsLoggedIn(false);
      });
  }

  return (
    <form onSubmit={signIn}>
      <button type="submit">Sign In/Sign Up with Google</button>
    </form>
  )
}

export default SignIn;
