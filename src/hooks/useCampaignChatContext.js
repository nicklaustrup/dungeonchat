import { useState, useEffect } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';

/**
 * Hook to fetch and listen to campaign data for chat context
 */
export function useCampaignChatContext(firestore, campaignId) {
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!firestore || !campaignId) {
      setLoading(false);
      setCampaign(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Listen to campaign changes
    const campaignRef = doc(firestore, 'campaigns', campaignId);
    const unsubscribe = onSnapshot(campaignRef, 
      (doc) => {
        if (doc.exists()) {
          setCampaign({ id: doc.id, ...doc.data() });
          setError(null);
        } else {
          setError('Campaign not found or you don\'t have access.');
          setCampaign(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to campaign:', err);
        setError('Failed to load campaign data.');
        setLoading(false);
      }
    );

    // Cleanup function
    return () => unsubscribe();
  }, [firestore, campaignId]);

  return { campaign, loading, error };
}