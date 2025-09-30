import React, { useState } from 'react';
import './AuthModal.css';
import useAuth from '../../hooks/useAuth';

function AuthModal({ isOpen, onClose, initialMode = 'signin' }) {
  const [mode, setMode] = useState(initialMode); // 'signin', 'signup', 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const {
    loading,
    error,
    clearError,
    signInWithGoogle,
    signInWithGithub,
    signUpWithEmail,
    signInWithEmail,
    resetPassword
  } = useAuth();

  if (!isOpen) return null;

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setMode('signin');
    setResetEmailSent(false);
    clearError();
    onClose();
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setResetEmailSent(false);
    clearError();
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      handleClose();
    } catch (error) {
      // Error is handled by the useAuth hook
    }
  };

  const handleGithubSignIn = async () => {
    try {
      await signInWithGithub();
      handleClose();
    } catch (error) {
      // Error is handled by the useAuth hook
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    
    if (mode === 'signup' && password !== confirmPassword) {
      return; // Password mismatch error will be shown in UI
    }

    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
        handleClose();
      } else if (mode === 'signup') {
        await signUpWithEmail(email, password);
        handleClose();
      } else if (mode === 'reset') {
        await resetPassword(email);
        setResetEmailSent(true);
      }
    } catch (error) {
      // Error is handled by the useAuth hook
    }
  };

  const passwordsMatch = password === confirmPassword;
  const isFormValid = email && password && (mode !== 'signup' || passwordsMatch);

  return (
    <div className="auth-modal-overlay" onClick={handleClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={handleClose}>✕</button>
        
        <div className="auth-modal-header">
          <h2>
            {mode === 'signin' && 'Sign In'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'reset' && 'Reset Password'}
          </h2>
        </div>

        <div className="auth-modal-content">
          {mode === 'reset' && resetEmailSent ? (
            <div className="auth-success">
              <p>✅ Reset email sent!</p>
              <p>Check your inbox for password reset instructions.</p>
              <button 
                className="auth-link-button"
                onClick={() => handleModeChange('signin')}
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              {/* OAuth Providers */}
              {mode !== 'reset' && (
                <div className="auth-oauth-section">
                  <button 
                    className="auth-oauth-button google"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                  >
                    <span className="oauth-icon">🔍</span>
                    Continue with Google
                  </button>
                  
                  <button 
                    className="auth-oauth-button github"
                    onClick={handleGithubSignIn}
                    disabled={loading}
                  >
                    <span className="oauth-icon">🐙</span>
                    Continue with GitHub
                  </button>
                  
                  <div className="auth-divider">
                    <span>or</span>
                  </div>
                </div>
              )}

              {/* Email/Password Form */}
              <form onSubmit={handleEmailSubmit} className="auth-form">
                <div className="auth-field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={loading}
                  />
                </div>

                {mode !== 'reset' && (
                  <div className="auth-field">
                    <label htmlFor="password">Password</label>
                    <div className="password-input-container">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        disabled={loading}
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? '👁️' : '🙈'}
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'signup' && (
                  <div className="auth-field">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      required
                      disabled={loading}
                      minLength={6}
                    />
                    {confirmPassword && !passwordsMatch && (
                      <span className="field-error">Passwords don't match</span>
                    )}
                  </div>
                )}

                {error && (
                  <div className="auth-error">
                    {error}
                  </div>
                )}

                <button 
                  type="submit" 
                  className="auth-submit-button"
                  disabled={loading || !isFormValid}
                >
                  {loading ? 'Loading...' : (
                    mode === 'signin' ? 'Sign In' :
                    mode === 'signup' ? 'Create Account' :
                    'Send Reset Email'
                  )}
                </button>
              </form>

              {/* Mode Switching Links */}
              <div className="auth-links">
                {mode === 'signin' && (
                  <>
                    <button 
                      className="auth-link-button"
                      onClick={() => handleModeChange('signup')}
                    >
                      Don't have an account? Sign up
                    </button>
                    <button 
                      className="auth-link-button"
                      onClick={() => handleModeChange('reset')}
                    >
                      Forgot password?
                    </button>
                  </>
                )}
                
                {mode === 'signup' && (
                  <button 
                    className="auth-link-button"
                    onClick={() => handleModeChange('signin')}
                  >
                    Already have an account? Sign in
                  </button>
                )}
                
                {mode === 'reset' && (
                  <button 
                    className="auth-link-button"
                    onClick={() => handleModeChange('signin')}
                  >
                    Back to Sign In
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthModal;