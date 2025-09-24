import React from 'react';
import { useFirebase } from '../../services/FirebaseContext';

function SignOut() {
    const { auth, signOut } = useFirebase();
    return auth.currentUser && (
        <button className="sign-out" onClick={() => signOut(auth)}>Sign Out</button>
    )
}

export default SignOut;
