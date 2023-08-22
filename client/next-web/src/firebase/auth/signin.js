import firebase_app from "../config";
import { signInWithPopup, GoogleAuthProvider, getAuth } from "firebase/auth";

const auth = getAuth(firebase_app);

export default async function signIn() {
  let result = null,
    error = null;
  try {
    var provider = new GoogleAuthProvider();
    result = await signInWithPopup(auth, provider);
  } catch (e) {
    error = e;
  }

  return { result, error };
}
