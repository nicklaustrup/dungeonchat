/**
 * Dice History Hook
 * React hook for fetching and managing dice roll history and statistics
 */

import { useState, useEffect, useCallback } from "react";
import {
  getCampaignDiceHistory,
  getCampaignDiceStatistics,
} from "../services/diceHistoryService";

export function useDiceHistory(firestore, campaignId, options = {}) {
  const { limitCount = 50, autoRefresh = true, userId = null } = options;

  const [history, setHistory] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dice history
  const fetchHistory = useCallback(async () => {
    if (!firestore) return;

    try {
      setLoading(true);
      setError(null);
      const [historyData, statsData] = await Promise.all([
        getCampaignDiceHistory(firestore, campaignId, limitCount),
        getCampaignDiceStatistics(firestore, campaignId, userId),
      ]);

      setHistory(historyData);
      setStatistics(statsData);
    } catch (err) {
      console.error("Error fetching dice history:", err);
      setError(err.message);
      // Keep existing data on error
    } finally {
      setLoading(false);
    }
  }, [firestore, campaignId, limitCount, userId]);

  // Initial fetch
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || error) return; // Don't auto-refresh if there's an error

    const interval = setInterval(fetchHistory, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, fetchHistory, error]);

  return {
    history,
    statistics,
    loading,
    error,
    refresh: fetchHistory,
  };
}

/**
 * Hook for user-specific dice statistics
 */
export function useUserDiceStats(firestore, userId) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore || !userId) return;

    // For now, return empty stats
    // Future enhancement: implement cross-campaign user stats
    setStats({
      totalRolls: 0,
      favoriteNotation: null,
      totalCriticals: 0,
    });
    setLoading(false);
  }, [firestore, userId]);

  return { stats, loading };
}
