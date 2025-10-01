/**
 * Voice Chat Demo Page
 * Standalone demo for testing voice chat functionality
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { useFirebase } from '../../services/FirebaseContext';
import VoiceChatPanel from '../../components/Voice/VoiceChatPanel';
import './VoiceChatDemo.css';

function VoiceChatDemo() {
  const { campaignId } = useParams();
  const { user } = useFirebase();

  // For demo purposes, use a test campaign ID if not provided
  const testCampaignId = campaignId || 'test-campaign-voice';

  if (!user) {
    return (
      <div className="voice-demo-container">
        <div className="voice-demo-signin">
          <h2>Voice Chat Demo</h2>
          <p>Please sign in to test voice chat functionality.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="voice-demo-container">
      <div className="voice-demo-header">
        <h1>🎙️ Voice Chat Demo</h1>
        <p>Testing voice chat for campaign: <code>{testCampaignId}</code></p>
        <p className="user-info">Signed in as: <strong>{user.displayName || user.email}</strong></p>
      </div>

      <div className="voice-demo-content">
        <div className="voice-demo-instructions">
          <h3>📋 Testing Instructions</h3>
          <ol>
            <li>Open this page in <strong>two separate browser windows</strong> (or use an incognito window)</li>
            <li>Sign in with different accounts in each window</li>
            <li>Click <strong>"Join Voice"</strong> in both windows</li>
            <li>You should see both participants in the list</li>
            <li>Speak into your microphone - audio level bars should move</li>
            <li>Try muting/unmuting in each window</li>
            <li>Verify you can hear the other participant</li>
          </ol>

          <div className="voice-demo-note">
            <strong>Note:</strong> For testing on the same computer, you'll need:
            <ul>
              <li>Two different browsers (Chrome + Firefox), OR</li>
              <li>Regular + incognito mode with different Google accounts</li>
              <li>Headphones recommended to avoid echo</li>
            </ul>
          </div>
        </div>

        <div className="voice-demo-panel">
          <VoiceChatPanel 
            campaignId={testCampaignId} 
            roomId="voice-general" 
          />
        </div>

        <div className="voice-demo-troubleshooting">
          <h3>🔧 Troubleshooting</h3>
          <details>
            <summary>Microphone access denied</summary>
            <p>
              Check your browser settings and allow microphone access. 
              In Chrome: Settings → Privacy and Security → Site Settings → Microphone
            </p>
          </details>
          <details>
            <summary>Can't hear the other person</summary>
            <ul>
              <li>Check your volume/speaker settings</li>
              <li>Verify the other person isn't muted</li>
              <li>Check browser console for connection errors</li>
              <li>Try refreshing both windows</li>
            </ul>
          </details>
          <details>
            <summary>Connection issues</summary>
            <ul>
              <li>Make sure you're on the same campaign ID</li>
              <li>Check Firebase console for rule errors</li>
              <li>Open browser DevTools (F12) and check Console for errors</li>
              <li>Verify STUN servers are accessible (firewall issue?)</li>
            </ul>
          </details>
        </div>
      </div>
    </div>
  );
}

export default VoiceChatDemo;
