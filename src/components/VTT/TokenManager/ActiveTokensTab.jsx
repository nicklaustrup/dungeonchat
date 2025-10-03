import React, { useState, useEffect, useContext } from 'react';
import { FirebaseContext } from '../../../services/FirebaseContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import ActiveTokenItem from './ActiveTokenItem';
import ActiveLightItem from './ActiveLightItem';
import './ActiveTokensTab.css';

/**
 * ActiveTokensTab - Shows all tokens currently deployed on the map
 * Provides quick navigation and editing access to active tokens and lights
 */
const ActiveTokensTab = ({
  campaignId,
  mapId,
  onFocusToken,
  onFocusLight,
  onEditToken,
  onEditLight
}) => {
  const { firestore } = useContext(FirebaseContext);
  const [activeTokens, setActiveTokens] = useState([]);
  const [lights, setLights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Subscribe to active (deployed) tokens
  useEffect(() => {
    if (!firestore || !campaignId || !mapId) return;

    console.log('ActiveTokensTab: Subscribing to active tokens for map:', mapId);
    const tokensRef = collection(firestore, 'campaigns', campaignId, 'vtt', mapId, 'tokens');
    const activeQuery = query(tokensRef, where('staged', '==', false));

    const unsubscribe = onSnapshot(
      activeQuery,
      (snapshot) => {
        const tokens = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('ActiveTokensTab: Active tokens received:', tokens.length);
        setActiveTokens(tokens);
        setLoading(false);
      },
      (err) => {
        console.error('Error subscribing to active tokens:', err);
        setError('Failed to load active tokens: ' + err.message);
        setLoading(false);
      }
    );

    return () => {
      console.log('ActiveTokensTab: Unsubscribing from active tokens');
      unsubscribe();
    };
  }, [firestore, campaignId, mapId]);

  // Subscribe to lights
  useEffect(() => {
    if (!firestore || !campaignId || !mapId) return;

    console.log('ActiveTokensTab: Subscribing to lights for map:', mapId);
    const lightsRef = collection(firestore, 'campaigns', campaignId, 'maps', mapId, 'lights');

    const unsubscribe = onSnapshot(
      lightsRef,
      (snapshot) => {
        const lightsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('ActiveTokensTab: Lights received:', lightsList.length);
        setLights(lightsList);
      },
      (err) => {
        console.error('Error subscribing to lights:', err);
        setError('Failed to load lights: ' + err.message);
      }
    );

    return () => {
      console.log('ActiveTokensTab: Unsubscribing from lights');
      unsubscribe();
    };
  }, [firestore, campaignId, mapId]);

  if (loading) {
    return (
      <div className="active-tokens-tab loading">
        <div className="loading-spinner">⏳ Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="active-tokens-tab error">
        <div className="error-message">⚠️ {error}</div>
      </div>
    );
  }

  const isEmpty = activeTokens.length === 0 && lights.length === 0;

  return (
    <div className="active-tokens-tab">
      <div className="active-tokens-header">
        <h4>Active Elements</h4>
        <p className="active-tokens-info">
          All tokens and lights currently deployed on the map
        </p>
      </div>

      {isEmpty ? (
        <div className="empty-active-tokens">
          <span className="empty-icon">🗺️</span>
          <p>No active tokens or lights</p>
          <small>Reveal tokens from Staging or add lights to see them here</small>
        </div>
      ) : (
        <div className="active-items-list">
          {/* Active Tokens Section */}
          {activeTokens.length > 0 && (
            <div className="active-section">
              <div className="section-header">
                <span className="section-icon">🎭</span>
                <span className="section-title">Tokens</span>
                <span className="section-count">{activeTokens.length}</span>
              </div>
              <div className="section-items">
                {activeTokens.map(token => (
                  <ActiveTokenItem
                    key={token.id}
                    token={token}
                    onFocus={onFocusToken}
                    onEdit={onEditToken}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Lights Section */}
          {lights.length > 0 && (
            <div className="active-section">
              <div className="section-header">
                <span className="section-icon">💡</span>
                <span className="section-title">Lights</span>
                <span className="section-count">{lights.length}</span>
              </div>
              <div className="section-items">
                {lights.map(light => (
                  <ActiveLightItem
                    key={light.id}
                    light={light}
                    onFocus={onFocusLight}
                    onEdit={onEditLight}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActiveTokensTab;
