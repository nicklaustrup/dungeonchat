import React, { useState, useContext, useEffect, useRef } from 'react';
import TokenPalette from './TokenPalette';
// eslint-disable-next-line no-unused-vars
import TokenUploader from './TokenUploader';
import ActiveTokensTab from './ActiveTokensTab';
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
  onTokenDeselect,
  onTokenSelect,
  onClose,
  onCenterCamera,
  onOpenLightEditor
}) => {
  const { user, firestore, storage } = useContext(FirebaseContext);
  const [activeView, setActiveView] = useState('palette'); // 'palette', 'upload', 'properties', 'staging'
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [stagingTokens, setStagingTokens] = useState([]);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const sidebarResizeStartRef = useRef({ x: 0, width: 0 });
  const [sidebarWidth, setSidebarWidth] = useState(420);

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
      // Player tokens from staging area start at 0.5 x 0.5 (tiny size = 25x25px)
      const sizeMultiplier = tokenData.size || 0.5;
      const baseSizeMultiplier = tokenData.type === 'pc' ? 0.5 : sizeMultiplier;
      const pixelSize = baseSizeMultiplier * 50;

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
  // eslint-disable-next-line no-unused-vars
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

  // Handle uploading art for existing token (from TokenPalette)
  const handleUploadArt = async (file) => {
    if (!selectedToken) {
      setError('No token selected');
      return;
    }

    if (!user) {
      setError('You must be logged in to upload token art');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Upload image to Firebase Storage
      const imageUrl = await tokenService.uploadTokenImage(
        storage,
        file,
        campaignId
      );

      // Update token with new imageUrl
      const tokenId = selectedToken.id || selectedToken.tokenId;
      await tokenService.updateToken(firestore, campaignId, mapId, tokenId, {
        imageUrl,
        updatedAt: new Date()
      });

      setSuccessMessage('Token art uploaded successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);

      if (onTokenUpdated) {
        onTokenUpdated(tokenId, { imageUrl });
      }
    } catch (err) {
      console.error('Error uploading token art:', err);
      setError(err.message || 'Failed to upload token art');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle removing art from existing token
  const handleRemoveArt = async () => {
    if (!selectedToken) {
      setError('No token selected');
      return;
    }

    if (!user) {
      setError('You must be logged in to modify tokens');
      return;
    }

    try {
      // Remove imageUrl from token
      const tokenId = selectedToken.id || selectedToken.tokenId;
      await tokenService.updateToken(firestore, campaignId, mapId, tokenId, {
        imageUrl: null,
        updatedAt: new Date()
      });

      setSuccessMessage('Token art removed successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);

      if (onTokenUpdated) {
        onTokenUpdated(tokenId, { imageUrl: null });
      }
    } catch (err) {
      console.error('Error removing token art:', err);
      setError(err.message || 'Failed to remove token art');
    }
  };

  // Handle focusing camera on a token
  const handleFocusToken = (token) => {
    if (!token || !token.position) {
      console.warn('Cannot focus on token without position:', token);
      return;
    }

    console.log('Focusing camera on token:', token.name, token.position);

    // Call parent handler to center camera
    if (onCenterCamera) {
      onCenterCamera(token.position.x, token.position.y);
    }

    // Select the token
    if (onTokenSelect) {
      onTokenSelect(token.id || token.tokenId);
    }

    // Switch to palette tab to show token details
    setActiveView('palette');
  };

  // Handle focusing camera on a light
  const handleFocusLight = (light) => {
    if (!light || !light.position) {
      console.warn('Cannot focus on light without position:', light);
      return;
    }

    console.log('Focusing camera on light:', light.name || light.type, light.position);

    // Call parent handler to center camera
    if (onCenterCamera) {
      onCenterCamera(light.position.x, light.position.y);
    }
  };

  // Handle editing a token - opens character sheet or palette
  const handleEditToken = (token) => {
    console.log('Editing token:', token.name);

    // For PC, NPC, or Enemy tokens, try to open character sheet
    // TODO: Implement character sheet integration
    if (['pc', 'npc', 'enemy'].includes(token.type)) {
      console.log('TODO: Open character sheet for', token.name);
      // Fallback to palette for now
    }

    // Select the token
    if (onTokenSelect) {
      onTokenSelect(token.id || token.tokenId);
    }

    // Switch to palette tab
    setActiveView('palette');
  };

  // Handle editing a light
  const handleEditLight = (light) => {
    console.log('TokenManager: Editing light:', light.name || light.type, light);

    // Switch to Active tab if not already there
    if (activeView !== 'active') {
      setActiveView('active');
    }

    // Call parent handler to open light editor modal
    if (onOpenLightEditor) {
      console.log('TokenManager: Calling onOpenLightEditor with light:', light.id);
      onOpenLightEditor(light);
    } else {
      console.warn('TokenManager: onOpenLightEditor handler not provided');
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

  // Handle sidebar resize
  useEffect(() => {
    if (!isResizingSidebar) return;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - sidebarResizeStartRef.current.x;
      // For right-side panel, dragging left (negative deltaX) should increase width
      const newWidth = Math.max(300, Math.min(800, sidebarResizeStartRef.current.width - deltaX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingSidebar]);

  // Handle starting sidebar resize
  const handleSidebarResizeStart = (e) => {
    e.preventDefault();
    setIsResizingSidebar(true);
    sidebarResizeStartRef.current = {
      x: e.clientX,
      width: sidebarWidth
    };
  };

  return (
    <div className="token-manager" style={{ width: sidebarWidth }}>
      {/* Resize Handle - Left Edge */}
      <div
        className="token-manager-resize-handle"
        onMouseDown={handleSidebarResizeStart}
        title="Drag to resize panel"
      />

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
          onClick={() => {
            setActiveView('staging');
            // Deselect token when switching to staging tab
            if (selectedToken && onTokenDeselect) {
              onTokenDeselect();
            }
          }}
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
          className={`tab-button ${activeView === 'active' ? 'active' : ''}`}
          onClick={() => {
            // Deselect any selected token when switching to Active tab
            if (onTokenDeselect) {
              onTokenDeselect();
            }
            setActiveView('active');
          }}
        >
          🎯 Active
        </button>
        {/* Upload tab removed - functionality moved to Palette tab */}
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
                <small style={{ display: 'block', marginTop: '8px' }}>💡 Players with character sheets will auto-create tokens when they join</small>
              </div>
            ) : (
              <div className="staged-token-list">
                {stagingTokens.map((token) => (
                  <div
                    key={token.id}
                    className="staged-token-item"
                    draggable={true}
                    onDragStart={(e) => {
                      // Set token data for drag operation
                      // Create HTML drag image (colored circle matching token)
                      const dragImage = document.createElement('div');
                      dragImage.style.width = '30px';
                      dragImage.style.height = '30px';
                      dragImage.style.borderRadius = '50%';
                      dragImage.style.backgroundColor = token.color || '#4a90e2';
                      dragImage.style.border = '3px solid white';
                      dragImage.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
                      dragImage.style.display = 'flex';
                      dragImage.style.alignItems = 'center';
                      dragImage.style.justifyContent = 'center';
                      dragImage.style.fontSize = '20px';
                      dragImage.style.fontWeight = 'bold';
                      dragImage.style.color = 'white';
                      dragImage.style.position = 'absolute';
                      dragImage.style.top = '-1000px';
                      dragImage.style.left = '-1000px';
                      dragImage.style.zIndex = '9999';
                      // Use first letter of token name or token type indicator
                      dragImage.textContent = token.name ? token.name.charAt(0).toUpperCase() : '?';

                      // Append to body temporarily so it renders
                      document.body.appendChild(dragImage);

                      e.dataTransfer.setDragImage(dragImage, 20, 20);
                      e.dataTransfer.setData('application/json', JSON.stringify(token));
                      e.dataTransfer.effectAllowed = 'copy';
                      
                      // Clean up drag image after a short delay to ensure it's used
                      setTimeout(() => {
                        document.body.removeChild(dragImage);
                      }, 0);

                      console.log('Started dragging staged token:', token);
                    }}
                  >
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
            onUploadArt={handleUploadArt}
            onRemoveArt={handleRemoveArt}
            isCreating={isCreating}
            isUploading={isCreating}
          />
        )}

        {activeView === 'active' && (
          <ActiveTokensTab
            campaignId={campaignId}
            mapId={mapId}
            onFocusToken={handleFocusToken}
            onFocusLight={handleFocusLight}
            onEditToken={handleEditToken}
            onEditLight={handleEditLight}
          />
        )}

        {/* Upload tab removed - functionality moved to Palette tab */}

      </div>
    </div >

  );
};

export default TokenManager;
