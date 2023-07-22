import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAVqhwbdB8I56HAMVVlgJKZcfrBkKI2AhQ",
  authDomain: "assistly-kubernetes.firebaseapp.com",
  projectId: "assistly-kubernetes",
  storageBucket: "assistly-kubernetes.appspot.com",
  messagingSenderId: "806733379891",
  appId: "1:806733379891:web:48bf124c0d9b90298e6646",
  measurementId: "G-XVWF8XDKS5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default auth;