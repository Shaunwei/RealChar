import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyAzaqNd3UvjXc2RHfKwe7xQlWUkoGpplVI',
  authDomain: 'realchar-dev.firebaseapp.com',
  projectId: 'realchar-dev',
  storageBucket: 'realchar-dev.appspot.com',
  messagingSenderId: '1012986115389',
  appId: '1:1012986115389:web:4639cedb09653482d58154',
  measurementId: 'G-HTRWJKMTL1',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default auth;
export const analytics = getAnalytics();
