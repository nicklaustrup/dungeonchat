import React, { useState, useContext, useEffect } from 'react';
import TokenPalette from './TokenPalette';
import TokenUploader from './TokenUploader';
import { FirebaseContext } from '../../../services/FirebaseContext';
import { tokenService } from '../../../services/vtt/tokenService';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import './TokenManager.css';

/**
 * TokenManager - Main token management interface
 * Combines TokenPalette, TokenUploader, and TokenProperties
 * Manages token creation, editing, and deletion
 */
const TokenManager = ({ 
  campaignId, 
  mapId, 
  selectedToken, 
  onTokenCreated,
  onTokenUpdated,
  onTokenDeleted,
  onClose 
}) => {
  const { user, firestore, storage } = useContext(FirebaseContext);
  const [activeView, setActiveView] = useState('palette'); // 'palette', 'upload', 'properties', 'staging'
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [stagingTokens, setStagingTokens] = useState([]);

  // Auto-switch to palette tab when a token is selected to show its info
  useEffect(() => {
    if (selectedToken && activeView !== 'palette') {
      setActiveView('palette');
    }
  }, [selectedToken, activeView]);

  // Subscribe to staged tokens
  useEffect(() => {
    if (!firestore || !campaignId || !mapId) return;

    console.log('TokenManager: Setting up staged tokens subscription for map:', mapId);
    const tokensRef = collection(firestore, 'campaigns', campaignId, 'vtt', mapId, 'tokens');
    const stagedQuery = query(tokensRef, where('staged', '==', true));

    const unsubscribe = onSnapshot(stagedQuery, (snapshot) => {
      const tokens = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('TokenManager: Staged tokens received:', tokens.length, tokens);
      setStagingTokens(tokens);
    }, (error) => {
      console.error('Error subscribing to staged tokens:', error);
      setError('Failed to load staged tokens: ' + error.message);
    });

    return () => {
      console.log('TokenManager: Unsubscribing from staged tokens');
      unsubscribe();
    };
  }, [firestore, campaignId, mapId]);

  // Handle creating a new token from palette
  const handleCreateToken = async (tokenData) => {
    if (!user) {
      setError('You must be logged in to create tokens');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Convert size multiplier to pixel size structure
      const sizeMultiplier = tokenData.size || 1;
      const pixelSize = sizeMultiplier * 50;

      const newToken = await tokenService.createToken(firestore, campaignId, mapId, {
        ...tokenData,
        size: { width: pixelSize, height: pixelSize },
        position: { x: 200, y: 200 }, // Default position when revealed
        staged: true, // Start in staging area
        createdBy: user.uid,
        createdAt: new Date()
      });

      setSuccessMessage('Token created successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Switch to staging tab to see the new token
      setActiveView('staging');
      
      if (onTokenCreated) {
        onTokenCreated(newToken);
      }
    } catch (err) {
      console.error('Error creating token:', err);
      setError(err.message || 'Failed to create token');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle uploading custom token image
  const handleUploadToken = async (file, tokenData) => {
    if (!user) {
      setError('You must be logged in to upload tokens');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Upload image first
      const imageUrl = await tokenService.uploadTokenImage(
        storage,
        file,
        campaignId
      );

      // Create token with uploaded image
      // Convert size multiplier to pixel size structure
      const sizeMultiplier = tokenData.size || 1;
      const pixelSize = sizeMultiplier * 50;

      const newToken = await tokenService.createToken(firestore, campaignId, mapId, {
        ...tokenData,
        size: { width: pixelSize, height: pixelSize },
        position: { x: 200, y: 200 }, // Default position when revealed
        imageUrl,
        staged: true, // Start in staging area
        createdBy: user.uid,
        createdAt: new Date()
      });

      setSuccessMessage('Custom token uploaded successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      if (onTokenCreated) {
        onTokenCreated(newToken);
      }

      // Switch back to palette view
      setActiveView('palette');
    } catch (err) {
      console.error('Error uploading token:', err);
      setError(err.message || 'Failed to upload token');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle updating token properties
  const handleUpdateToken = async (tokenId, updates) => {
    setError(null);

    try {
      await tokenService.updateToken(firestore, campaignId, mapId, tokenId, updates);
      
      setSuccessMessage('Token updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      if (onTokenUpdated) {
        onTokenUpdated(tokenId, updates);
      }
    } catch (err) {
      console.error('Error updating token:', err);
      setError(err.message || 'Failed to update token');
    }
  };

  // Handle deleting a token
  const handleDeleteToken = async (tokenId, imageUrl) => {
    if (!window.confirm('Are you sure you want to delete this token?')) {
      return;
    }

    setError(null);

    try {
      await tokenService.deleteToken(firestore, campaignId, mapId, tokenId);
      
      setSuccessMessage('Token deleted successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      if (onTokenDeleted) {
        onTokenDeleted(tokenId);
      }
    } catch (err) {
      console.error('Error deleting token:', err);
      setError(err.message || 'Failed to delete token');
    }
  };

  return (
    <div className="token-manager">
      <div className="token-manager-header">
        <h3>🎭 Token Manager</h3>
        {onClose && (
          <button className="close-button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        )}
      </div>

      {/* View Tabs */}
      <div className="token-manager-tabs">
        <button
          className={`tab-button ${activeView === 'staging' ? 'active' : ''}`}
          onClick={() => setActiveView('staging')}
        >
          📦 Staging ({stagingTokens.length})
        </button>
        <button
          className={`tab-button ${activeView === 'palette' ? 'active' : ''}`}
          onClick={() => setActiveView('palette')}
        >
          🎨 Palette {selectedToken ? '(Editing)' : ''}
        </button>
        <button
          className={`tab-button ${activeView === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveView('upload')}
        >
          📤 Upload
        </button>
        {/* Settings tab commented out - may come back later
        <button
          className={`tab-button ${activeView === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveView('settings')}
        >
          ⚙️ Settings
        </button>
        */}
      </div>

      {/* Messages */}
      {error && (
        <div className="token-manager-error">
          ⚠️ {error}
        </div>
      )}
      {successMessage && (
        <div className="token-manager-success">
          ✅ {successMessage}
        </div>
      )}

      {/* Content Area */}
      <div className="token-manager-content">
        {activeView === 'staging' && (
          <div className="staging-area">
            <div className="staging-header">
              <h4>Staged Tokens</h4>
              <p className="staging-info">
                Tokens created here start off-map. Click "✓ Reveal" to place them on the map.
              </p>
            </div>
            {stagingTokens.length === 0 ? (
              <div className="empty-staging">
                <p>No staged tokens</p>
                <small>Use the Palette or Upload tabs to create tokens</small>
                <small style={{display: 'block', marginTop: '8px'}}>💡 Players with character sheets will auto-create tokens when they join</small>
              </div>
            ) : (
              <div className="staged-token-list">
                {stagingTokens.map((token) => (
                  <div key={token.id} className="staged-token-item">
                    <div 
                      className="token-color-preview" 
                      style={{ backgroundColor: token.color }}
                    />
                    <div className="token-info">
                      <span className="token-name">{token.name}</span>
                      <span className="token-type">{token.type}</span>
                    </div>
                    <button 
                      className="reveal-button"
                      onClick={async () => {
                        try {
                          await tokenService.updateToken(firestore, campaignId, mapId, token.id, { staged: false });
                        } catch (err) {
                          setError('Failed to reveal token: ' + err.message);
                        }
                      }}
                      title="Place on map"
                    >
                      ✓ Reveal
                    </button>
                    <button 
                      className="delete-button-small"
                      onClick={() => handleDeleteToken(token.id)}
                      title="Delete token"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === 'palette' && (
          <TokenPalette
            selectedToken={selectedToken}
            onCreateToken={handleCreateToken}
            onUpdateToken={handleUpdateToken}
            isCreating={isCreating}
          />
        )}

        {activeView === 'upload' && (
          <TokenUploader
            onUpload={handleUploadToken}
            isUploading={isCreating}
          />
        )}
      </div>
    </div>
  );
};

export default TokenManager;
