import React from 'react';
import useAuth from '../../hooks/useAuth';

function SignOut() {
    const { user, signOut } = useAuth();
    
    return user && (
        <button className="sign-out" onClick={signOut}>Sign Out</button>
    );
}

export default SignOut;
