import React from 'react';
import { useFirebase } from '../../services/FirebaseContext';

function SignIn() {
  const { auth, signInWithPopup, GoogleAuthProvider } = useFirebase();

  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  }

  return (
    <button className="sign-in" onClick={signInWithGoogle}>Sign in with Google</button>
  )
}

export default SignIn;
