/**
 * Dice Statistics Component
 * Displays campaign dice roll statistics and analytics
 */

import React from 'react';
import './DiceStatistics.css';

function DiceStatistics({ statistics, loading, campaignId }) {
  if (loading) {
    return (
      <div className="dice-statistics loading">
        <div className="stats-skeleton">
          <div className="skeleton-item"></div>
          <div className="skeleton-item"></div>
          <div className="skeleton-item"></div>
        </div>
      </div>
    );
  }

  if (!statistics || statistics.totalRolls === 0) {
    return (
      <div className="dice-statistics empty">
        <div className="empty-state">
          <h4>📊 No Dice Statistics Yet</h4>
          <p>Start rolling dice to see statistics and patterns!</p>
          <small>Use <code>/roll 1d20</code> in chat or the dice roller</small>
        </div>
      </div>
    );
  }

  const {
    totalRolls,
    averageRoll,
    highestRoll,
    lowestRoll,
    criticalHits,
    criticalFails,
    mostUsedDie,
    rollsByType,
    recentActivity
  } = statistics;

  // Calculate percentages
  const critHitPercent = totalRolls > 0 ? ((criticalHits / totalRolls) * 100).toFixed(1) : 0;
  const critFailPercent = totalRolls > 0 ? ((criticalFails / totalRolls) * 100).toFixed(1) : 0;

  return (
    <div className="dice-statistics">
      <div className="stats-header">
        <h4>📊 Dice Statistics</h4>
        <span className="total-rolls">{totalRolls} total rolls</span>
      </div>

      <div className="stats-grid">
        {/* Core Statistics */}
        <div className="stat-card">
          <div className="stat-label">Average Roll</div>
          <div className="stat-value primary">{averageRoll}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Highest Roll</div>
          <div className="stat-value success">{highestRoll}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Lowest Roll</div>
          <div className="stat-value">{lowestRoll}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Recent Activity</div>
          <div className="stat-value">{recentActivity} this week</div>
        </div>

        {/* Critical Statistics */}
        <div className="stat-card critical-hits">
          <div className="stat-label">🎯 Critical Hits</div>
          <div className="stat-value">
            {criticalHits} <span className="percentage">({critHitPercent}%)</span>
          </div>
        </div>

        <div className="stat-card critical-fails">
          <div className="stat-label">💥 Critical Fails</div>
          <div className="stat-value">
            {criticalFails} <span className="percentage">({critFailPercent}%)</span>
          </div>
        </div>
      </div>

      {/* Most Used Die */}
      {mostUsedDie && (
        <div className="most-used-die">
          <div className="stat-label">🎲 Most Used</div>
          <div className="die-notation">{mostUsedDie}</div>
          <div className="usage-count">
            {rollsByType[mostUsedDie]} rolls
          </div>
        </div>
      )}

      {/* Roll Types Breakdown */}
      {Object.keys(rollsByType).length > 1 && (
        <div className="roll-types">
          <div className="stat-label">Roll Distribution</div>
          <div className="roll-types-list">
            {Object.entries(rollsByType)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([notation, count]) => (
                <div key={notation} className="roll-type-item">
                  <span className="notation">{notation}</span>
                  <span className="count">{count}</span>
                  <div 
                    className="usage-bar"
                    style={{ 
                      width: `${(count / Math.max(...Object.values(rollsByType))) * 100}%` 
                    }}
                  />
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DiceStatistics;