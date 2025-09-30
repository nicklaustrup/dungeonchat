/**
 * Dice History Panel Component
 * Combines dice roll history and statistics with tabbed interface
 */

import React, { useState } from 'react';
import { useDiceHistory } from '../../hooks/useDiceHistory';
import { DiceRollHistory } from './DiceRollDisplay';
import DiceStatistics from './DiceStatistics';
import './DiceHistoryPanel.css';

function DiceHistoryPanel({ firestore, campaignId, userId = null }) {
  const [activeTab, setActiveTab] = useState('history');
  const [error, setError] = useState(null);
  const { history, statistics, loading, refresh } = useDiceHistory(
    firestore, 
    campaignId, 
    { limitCount: 50, autoRefresh: true, userId }
  );

  // Format history data for DiceRollHistory component
  const formattedRolls = history.map(roll => ({
    rollData: roll.diceData,
    playerName: roll.displayName,
    timestamp: roll.timestamp,
    channelName: roll.channelName,
    id: roll.id
  }));

  // Handle errors from the hook
  React.useEffect(() => {
    if (history.length === 0 && !loading) {
      // Try to refresh once more in case of initial load issues
      refresh().catch(err => {
        setError(err.message);
      });
    }
  }, [history, loading, refresh]);

  if (error) {
    const isIndexError = error.includes('index');
    return (
      <div className="dice-history-panel error">
        <div className="error-state">
          <h4>{isIndexError ? '⏳ Setting Up Dice History' : '❌ Error Loading Dice Data'}</h4>
          <p>{error}</p>
          {isIndexError && (
            <div className="index-building-info">
              <p><strong>What's happening?</strong></p>
              <p>Firebase is building database indexes for dice roll queries. This usually takes 2-5 minutes.</p>
              <p>You can continue using the app normally - dice history will be available once the indexes are ready.</p>
            </div>
          )}
          <button onClick={() => { setError(null); refresh(); }} className="retry-button">
            {isIndexError ? 'Check Again' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dice-history-panel">
      <div className="panel-header">
        <div className="panel-tabs">
          <button
            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            🎲 Roll History
          </button>
          <button
            className={`tab-button ${activeTab === 'statistics' ? 'active' : ''}`}
            onClick={() => setActiveTab('statistics')}
          >
            📊 Statistics
          </button>
        </div>
        
        <button onClick={refresh} className="refresh-button" disabled={loading}>
          {loading ? '⟳' : '🔄'}
        </button>
      </div>

      <div className="panel-content">
        {activeTab === 'history' && (
          <div className="history-tab">
            <DiceRollHistory 
              rolls={formattedRolls} 
              maxDisplayed={20}
              showChannelNames={!!campaignId}
            />
          </div>
        )}
        
        {activeTab === 'statistics' && (
          <div className="statistics-tab">
            <DiceStatistics 
              statistics={statistics} 
              loading={loading}
              campaignId={campaignId}
            />
          </div>
        )}
      </div>

      {!loading && history.length > 0 && (
        <div className="panel-footer">
          <small className="last-updated">
            Last updated: {new Date().toLocaleTimeString()}
          </small>
        </div>
      )}
    </div>
  );
}

export default DiceHistoryPanel;