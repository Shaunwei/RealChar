import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAp7RlikLGBk9Hec1_4Zn6fx4HdwDKPJLQ",
  authDomain: "yainc-c172f.firebaseapp.com",
  projectId: "yainc-c172f",
  storageBucket: "yainc-c172f.appspot.com",
  messagingSenderId: "326036975392",
  appId: "1:326036975392:web:bde7e7c919ec7c7837f145",
  measurementId: "G-7TQHE8Z18F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default auth;