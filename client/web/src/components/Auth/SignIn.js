/**
 * src/components/Auth/SignIn.jsx
 * signin and signup with google account
 * 
 * created by Lynchee on 7/20/23
 */

import React, { useState } from 'react';
import auth from '../../utils/firebase';
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

export const signInWithGoogle = async (isLoggedIn) => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider) // Return the promise here
    .then((result) => {
      // This gives you a Google Access Token. You can use it to access the Google API.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      // The signed-in user info.
      const user = result.user;
      console.log(user);
      // IdP data available using getAdditionalUserInfo(result)
      // ...
      isLoggedIn.current = true;
    }).catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error(`Error occurred during sign in. Code: ${errorCode}, Message: ${errorMessage}`);
      // The email of the user's account used.
      const email = error.customData.email;
      // The AuthCredential type that was used.
      const credential = GoogleAuthProvider.credentialFromError(error);
      // ...
      isLoggedIn.current = false;
    });
}

const SignIn = ({ isLoggedIn }) => {
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    signInWithGoogle(isLoggedIn);
    setIsLoading(false);
  }

  return (
    <form onSubmit={signIn}>
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Signing In..." : "Sign In/Sign Up with Google"}
      </button>
    </form>
  )
}

export default SignIn;