import { useCallback } from "react";
import { collection, query, where, orderBy } from "firebase/firestore";
import { useFirebase } from "../FirebaseContext";
import { useCachedQuery, useCachedDocument } from "./useCachedDocument";
import firestoreCache from "./FirestoreCache";

/**
 * Cached Campaigns Hook
 *
 * Provides cached access to user's campaigns with real-time updates
 * Automatically handles cache invalidation on campaign changes
 *
 * Features:
 * - Automatic caching of campaign lists
 * - Real-time updates via Firestore listeners
 * - Separate queries for joined and created campaigns
 * - Automatic cache invalidation on mutations
 */

/**
 * Get all campaigns the user has joined
 */
export function useJoinedCampaigns() {
  const { firestore, user, authLoading } = useFirebase();

  const queryFn = useCallback(() => {
    if (!user?.uid) return null;

    const campaignsRef = collection(firestore, "campaigns");
    return query(
      campaignsRef,
      where("members", "array-contains", user.uid),
      orderBy("lastActivity", "desc")
    );
  }, [firestore, user]);

  const cacheKey = `campaigns/joined/${user?.uid}`;

  const { data, loading, error, refresh, invalidate } = useCachedQuery(
    firestore,
    queryFn,
    cacheKey,
    {
      ttl: 3 * 60 * 1000, // 3 minutes (campaigns change less frequently)
      realtime: true,
      disabled: !user?.uid,
    }
  );

  const finalLoading = authLoading || loading;

  console.log("[CAMPAIGNS] Returning:", {
    campaigns: data?.length || 0,
    loading: finalLoading,
    authLoading,
    queryLoading: loading,
    hasData: data?.length > 0,
  });

  return {
    campaigns: data,
    // If auth is loading or query is loading, we're still loading
    loading: finalLoading,
    error,
    refresh,
    invalidate,
  };
}

/**
 * Get campaigns created by the user
 */
export function useCreatedCampaigns() {
  const { firestore, user, authLoading } = useFirebase();

  const queryFn = useCallback(() => {
    if (!user?.uid) return null;

    const campaignsRef = collection(firestore, "campaigns");
    return query(
      campaignsRef,
      where("createdBy", "==", user.uid),
      orderBy("createdAt", "desc")
    );
  }, [firestore, user]);

  const cacheKey = `campaigns/created/${user?.uid}`;

  const { data, loading, error, refresh, invalidate } = useCachedQuery(
    firestore,
    queryFn,
    cacheKey,
    {
      ttl: 3 * 60 * 1000, // 3 minutes
      realtime: true,
      disabled: !user?.uid,
    }
  );

  return {
    campaigns: data,
    // If auth is loading or query is loading, we're still loading
    loading: authLoading || loading,
    error,
    refresh,
    invalidate,
  };
}

/**
 * Get all campaigns (both joined and created)
 */
export function useAllUserCampaigns() {
  const joined = useJoinedCampaigns();
  const created = useCreatedCampaigns();

  const loading = joined.loading || created.loading;
  const error = joined.error || created.error;

  // Merge and deduplicate campaigns
  const campaigns = useCallback(() => {
    const joinedCampaigns = joined.campaigns || [];
    const createdCampaigns = created.campaigns || [];

    const campaignMap = new Map();

    // Add all campaigns to map (automatically deduplicates by ID)
    [...joinedCampaigns, ...createdCampaigns].forEach((campaign) => {
      campaignMap.set(campaign.id, campaign);
    });

    return Array.from(campaignMap.values()).sort((a, b) => {
      const dateA =
        a.lastActivityAt?.toDate?.() || a.createdAt?.toDate?.() || new Date(0);
      const dateB =
        b.lastActivityAt?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    });
  }, [joined.campaigns, created.campaigns]);

  const refresh = useCallback(() => {
    joined.refresh();
    created.refresh();
  }, [joined, created]);

  const invalidate = useCallback(() => {
    joined.invalidate();
    created.invalidate();
  }, [joined, created]);

  return {
    campaigns: campaigns(),
    loading,
    error,
    refresh,
    invalidate,
  };
}

/**
 * Get a single campaign by ID
 */
export function useCachedCampaign(campaignId) {
  const { firestore } = useFirebase();

  const { data, loading, error, refresh, invalidate } = useCachedDocument(
    firestore,
    "campaigns",
    campaignId,
    {
      ttl: 5 * 60 * 1000, // 5 minutes
      realtime: true,
      disabled: !campaignId,
    }
  );

  return {
    campaign: data,
    loading,
    error,
    refresh,
    invalidate,
  };
}

/**
 * Invalidate all campaign caches for a user
 * Call this after creating, joining, or leaving a campaign
 */
export function invalidateUserCampaigns(userId) {
  firestoreCache.invalidate(`campaigns/joined/${userId}`);
  firestoreCache.invalidate(`campaigns/created/${userId}`);
}

/**
 * Invalidate a specific campaign cache
 * Call this after updating campaign details
 */
export function invalidateCampaign(campaignId) {
  firestoreCache.invalidateDocument("campaigns", campaignId);
}

/**
 * Invalidate all campaigns
 * Use sparingly - only for major campaign-related changes
 */
export function invalidateAllCampaigns() {
  firestoreCache.invalidateCollection("campaigns");
}

// Default export with all campaign cache utilities
const campaignsCache = {
  useJoinedCampaigns,
  useCreatedCampaigns,
  useAllUserCampaigns,
  useCachedCampaign,
  invalidateUserCampaigns,
  invalidateCampaign,
  invalidateAllCampaigns,
};

export default campaignsCache;
