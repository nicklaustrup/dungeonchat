import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useFirebase } from '../services/FirebaseContext';

/**
 * useCampaign Hook
 * Fetches campaign data and provides helper functions for campaign permissions
 */
export function useCampaign(campaignId) {
  const { firestore, user } = useFirebase();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!firestore || !campaignId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const campaignRef = doc(firestore, 'campaigns', campaignId);
    
    const unsubscribe = onSnapshot(
      campaignRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setCampaign({ id: snapshot.id, ...snapshot.data() });
          setError(null);
        } else {
          setCampaign(null);
          setError('Campaign not found');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching campaign:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, campaignId]);

  // Check if current user is the DM
  const isUserDM = campaign && user && campaign.dmId === user.uid;

  // Check if current user is a member
  const isUserMember = campaign && user && (
    campaign.dmId === user.uid || 
    (campaign.members && campaign.members.includes(user.uid))
  );

  return {
    campaign,
    loading,
    error,
    isUserDM,
    isUserMember
  };
}

export default useCampaign;
