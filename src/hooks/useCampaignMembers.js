import { useState, useEffect } from 'react';
import { onSnapshot, collection, getDoc, doc } from 'firebase/firestore';

/**
 * Hook to fetch and listen to campaign members with their profile data
 */
export function useCampaignMembers(firestore, campaignId) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!firestore || !campaignId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Listen to members changes
    const membersRef = collection(firestore, 'campaigns', campaignId, 'members');
    const unsubscribe = onSnapshot(membersRef,
      async (snapshot) => {
        try {
          // Fetch user profile data for each member
          const membersWithProfiles = await Promise.all(
            snapshot.docs.map(async (memberDoc) => {
              const memberData = { id: memberDoc.id, ...memberDoc.data() };
              
              try {
                // Get user profile data
                const profileDoc = await getDoc(doc(firestore, 'userProfiles', memberData.userId));
                if (profileDoc.exists()) {
                  const profileData = profileDoc.data();
                  memberData.displayName = profileData.displayName || 'Unknown User';
                  memberData.username = profileData.username || null;
                  memberData.photoURL = profileData.profilePictureURL || profileData.photoURL || null;
                  memberData.email = profileData.email || null;
                } else {
                  memberData.displayName = 'Unknown User';
                }
              } catch (profileError) {
                console.warn('Could not fetch profile for user:', memberData.userId);
                memberData.displayName = 'Unknown User';
              }
              
              return memberData;
            })
          );
          
          setMembers(membersWithProfiles);
          setError(null);
        } catch (err) {
          console.error('Error processing members update:', err);
          setError('Failed to load members');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error listening to members:', err);
        setError('Failed to listen to member updates');
        setLoading(false);
      }
    );

    // Cleanup function
    return () => unsubscribe();
  }, [firestore, campaignId]);

  return { members, loading, error, setMembers };
}