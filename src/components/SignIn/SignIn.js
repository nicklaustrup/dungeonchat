import React, { useState } from "react";
import "./SignIn.css";
import useAuth from "../../hooks/useAuth";

function SignIn() {
  const [mode, setMode] = useState("signin"); // 'signin', 'signup', 'reset'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showSetupNotice, setShowSetupNotice] = useState(false);

  const {
    loading,
    error,
    clearError,
    signInWithGoogle,
    signInWithGithub,
    signUpWithEmail,
    signInWithEmail,
    resetPassword,
  } = useAuth();

  // Check if error is related to setup issues
  const isSetupError = error && error.includes("not enabled");

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setResetEmailSent(false);
    setShowSetupNotice(false);
    clearError();
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      // Error is handled by the useAuth hook
    }
  };

  const handleGithubSignIn = async () => {
    try {
      await signInWithGithub();
    } catch (error) {
      // Error is handled by the useAuth hook
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();

    if (mode === "signup" && password !== confirmPassword) {
      return; // Password mismatch error will be shown in UI
    }

    try {
      if (mode === "signin") {
        await signInWithEmail(email, password);
      } else if (mode === "signup") {
        await signUpWithEmail(email, password);
      } else if (mode === "reset") {
        await resetPassword(email);
        setResetEmailSent(true);
      }
    } catch (error) {
      // Error is handled by the useAuth hook
    }
  };

  const passwordsMatch = password === confirmPassword;
  const isFormValid =
    email && password && (mode !== "signup" || passwordsMatch);

  return (
    <div className="sign-in-container">
      <div className="sign-in-card">
        <div className="sign-in-header">
          <h1>Welcome to Superchat</h1>
          <p>
            {mode === "signin" && "Sign in to your account"}
            {mode === "signup" && "Create a new account"}
            {mode === "reset" && "Reset your password"}
          </p>
        </div>

        <div className="sign-in-content">
          {mode === "reset" && resetEmailSent ? (
            <div className="auth-success">
              <div className="success-icon">✅</div>
              <h3>Reset email sent!</h3>
              <p>Check your inbox for password reset instructions.</p>
              <button
                className="auth-link-button"
                onClick={() => handleModeChange("signin")}
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
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

                {mode !== "reset" && (
                  <div className="auth-field">
                    <label htmlFor="password">Password</label>
                    <div className="password-input-container">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
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
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? "👁️" : "🙈"}
                      </button>
                    </div>
                  </div>
                )}

                {mode === "signup" && (
                  <div className="auth-field">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
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
                  <div
                    className={`auth-error ${isSetupError ? "setup-error" : ""}`}
                  >
                    {error}
                    {isSetupError && (
                      <button
                        type="button"
                        className="setup-help-btn"
                        onClick={() => setShowSetupNotice(!showSetupNotice)}
                      >
                        {showSetupNotice ? "Hide Help" : "Setup Help"}
                      </button>
                    )}
                  </div>
                )}

                {showSetupNotice && (
                  <div className="setup-notice">
                    <h4>🔧 Firebase Setup Required</h4>
                    <p>To enable email/password authentication:</p>
                    <ol>
                      <li>
                        Go to{" "}
                        <a
                          href="https://console.firebase.google.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Firebase Console
                        </a>
                      </li>
                      <li>Select your project</li>
                      <li>
                        Navigate to{" "}
                        <strong>Authentication → Sign-in method</strong>
                      </li>
                      <li>
                        Enable <strong>Email/Password</strong>
                      </li>
                      <li>
                        Optionally enable <strong>GitHub</strong> for more
                        sign-in options
                      </li>
                    </ol>
                    <p>
                      <small>
                        See docs/FIREBASE_AUTH_SETUP.md for detailed
                        instructions.
                      </small>
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  className="auth-submit-button"
                  disabled={loading || !isFormValid}
                >
                  {loading
                    ? "Loading..."
                    : mode === "signin"
                      ? "Sign In"
                      : mode === "signup"
                        ? "Create Account"
                        : "Send Reset Email"}
                </button>
              </form>

              {/* Mode Switching Links */}
              <div className="auth-links">
                {mode === "signin" && (
                  <>
                    <button
                      className="auth-link-button"
                      onClick={() => handleModeChange("signup")}
                    >
                      Don't have an account? Sign up
                    </button>
                    <button
                      className="auth-link-button"
                      onClick={() => handleModeChange("reset")}
                    >
                      Forgot password?
                    </button>
                  </>
                )}

                {mode === "signup" && (
                  <button
                    className="auth-link-button"
                    onClick={() => handleModeChange("signin")}
                  >
                    Already have an account? Sign in
                  </button>
                )}

                {mode === "reset" && (
                  <button
                    className="auth-link-button"
                    onClick={() => handleModeChange("signin")}
                  >
                    Back to Sign In
                  </button>
                )}
              </div>

              {/* OAuth Providers - Below forgot password link */}
              {mode !== "reset" && (
                <div className="auth-oauth-section">
                  <div className="auth-divider">
                    <span>or continue with</span>
                  </div>

                  <div className="oauth-buttons">
                    <button
                      className="auth-oauth-button google"
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                    >
                      <span className="oauth-icon">🔍</span>
                      Google
                    </button>

                    <button
                      className="auth-oauth-button github"
                      onClick={handleGithubSignIn}
                      disabled={loading}
                    >
                      <span className="oauth-icon">🐙</span>
                      GitHub
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SignIn;
