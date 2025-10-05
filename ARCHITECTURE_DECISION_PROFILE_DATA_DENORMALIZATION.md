# Architecture Decision: Should We Denormalize Campaign/Character Data into User Profiles?

**Date**: October 4, 2025
**Decision**: ❌ **NO - Keep Data Normalized**

---

## The Proposal

> "Save additional information to the player profile (that isn't visible to players) like campaigns that the user is a member of, the characters, etc. This would reduce Firebase calls and allow us to add a campaign and character display to the user Profile."

---

## Analysis

### Potential Benefits (Pros) ✅

1. **Faster profile page loads** - All data in one document
2. **Single read operation** - Profile + campaigns + characters
3. **Reduced network calls** - One fetch instead of multiple
4. **Simpler queries** - No joins needed
5. **Fun feature** - Campaign/character list on profile

### Significant Drawbacks (Cons) ❌

#### 1. **Data Duplication & Sync Complexity** 🔴 CRITICAL

**The Problem:**
```javascript
// Campaign data exists in TWO places now:
campaigns/{campaignId}        // Source of truth
userProfiles/{userId}.campaigns[]  // Duplicate copy

// Every campaign update requires TWO writes:
await updateDoc(doc(firestore, 'campaigns', campaignId), { name: 'New Name' });
await updateDoc(doc(firestore, 'userProfiles', dmId), { 
  'campaigns.{campaignId}.name': 'New Name' 
});

// What happens if one fails and the other succeeds?
// Data inconsistency! 💥
```

**Real-World Scenarios:**
- DM changes campaign name → Must update campaign doc + DM profile + all member profiles
- Player joins campaign → Update campaign doc + player profile
- Character updates → Update character doc + player profile
- Player leaves campaign → Update campaign doc + player profile + remove from member list

**Failure Points:**
- Network error during multi-write operation
- Insufficient permissions on one document
- Write conflicts from concurrent updates
- Partial failures leave inconsistent data

#### 2. **Firestore Document Size Limits** 🔴 CRITICAL

**Firestore Constraints:**
- Maximum document size: **1 MB**
- Maximum array elements: **No hard limit, but affects read/write costs**

**Real-World Math:**
```javascript
// Average user with moderate activity:
- 10 campaigns (5 active, 5 archived)
- 8 characters (2 per campaign average)
- Each campaign object: ~2-5 KB (name, description, members, settings)
- Each character object: ~10-20 KB (stats, inventory, spells, notes)

Total: (10 × 3KB) + (8 × 15KB) = 30KB + 120KB = 150KB

// Power user (realistic for your VTT):
- 50 campaigns (been playing for years)
- 100 characters (multiple per campaign, NPCs)
Total: 500KB+ 

// Approaching 1MB limit! 🚨
```

**What Happens When Limit Is Reached:**
- Writes fail silently or with cryptic errors
- User can't update profile
- User can't join new campaigns
- Emergency data migration required
- User experience breaks

#### 3. **Read/Write Cost Increase** 💰

**Current Architecture (Normalized):**
```javascript
// View profile page
- Read userProfiles/{userId}           → 1 read

// View campaigns list
- Query campaigns where userId=member  → N reads (only when needed)

// Update username
- Write userProfiles/{userId}          → 1 write
```

**Proposed Architecture (Denormalized):**
```javascript
// View profile page
- Read userProfiles/{userId}           → 1 read (BUT 150KB vs 5KB!)

// Update campaign name
- Write campaigns/{campaignId}         → 1 write
- Write userProfiles/{dmId}            → 1 write (150KB!)
- Write userProfiles/{member1}         → 1 write (150KB!)
- Write userProfiles/{member2}         → 1 write (150KB!)
- ... (N member writes)

// Update username (unrelated to campaigns)
- Write userProfiles/{userId}          → Still writes 150KB document!
```

**Cost Analysis:**
- Reading 150KB costs **same** as reading 5KB (per document)
- BUT: You're reading 150KB every time you fetch profile
- Writing 150KB costs **same** as writing 5KB
- BUT: You're writing 150KB on every profile update (even unrelated changes)
- **Network bandwidth**: 30x increase in data transferred

**Firebase Pricing Impact:**
- More data transferred per operation
- Slower operations (especially on mobile)
- Potential timeout issues with large documents
- Higher likelihood of concurrent write conflicts

#### 4. **Complexity & Maintenance Burden** 🔧

**New Code Required:**
```javascript
// Every campaign operation now needs profile sync:
async function updateCampaignName(campaignId, newName) {
  // 1. Update campaign
  await updateDoc(campaignRef, { name: newName });
  
  // 2. Get all members
  const members = await getCampaignMembers(campaignId);
  
  // 3. Update each member's profile (BATCH WRITE)
  const batch = writeBatch(firestore);
  members.forEach(member => {
    batch.update(doc(firestore, 'userProfiles', member.userId), {
      [`campaigns.${campaignId}.name`]: newName
    });
  });
  await batch.commit();
  
  // 4. Handle partial failures? Retry logic? Rollback?
}

// Similar for: joining, leaving, character updates, etc.
```

**Maintenance Issues:**
- More code to write and test
- More edge cases to handle
- More failure modes to debug
- More background jobs for eventual consistency
- More support tickets for data inconsistencies

#### 5. **Real-Time Updates Complexity** 🔄

**Current (Simple):**
```javascript
// Campaign list auto-updates via Firestore listener
const unsubscribe = onSnapshot(
  query(collection(firestore, 'campaigns'), where('members', 'array-contains', userId)),
  snapshot => setCampaigns(snapshot.docs.map(doc => doc.data()))
);
```

**Proposed (Complex):**
```javascript
// Must listen to profile changes for campaign updates
const unsubscribe = onSnapshot(
  doc(firestore, 'userProfiles', userId),
  snapshot => {
    // Extract campaigns array from profile
    // But how do you know what changed?
    // Need to diff previous vs current state
    // Trigger appropriate UI updates
    // Handle partial data (campaign details still in campaigns collection)
  }
);

// Still need to listen to campaign collection for full details!
// So you haven't actually reduced listeners...
```

#### 6. **Security & Privacy Concerns** 🔒

**Problem:**
```javascript
// User profile is readable by user
// But now contains campaign data that might have permissions
userProfiles/{userId} {
  campaigns: [
    { id: 'campaign1', name: 'Secret DM Campaign', dmNotes: '...' }
  ]
}

// Options:
// 1. Filter sensitive data before denormalizing (more complexity)
// 2. Use security rules to hide fields (not possible with current structure)
// 3. Accept that users can read more than they should (security risk)
```

---

## Alternative Solution: Smart Caching Strategy ✅

Instead of denormalization, use **intelligent caching at the application layer**:

### 1. Create a `useCampaignsList` Hook

```javascript
export function useCampaignsList() {
  const { user, firestore } = useFirebase();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!user || !firestore) return;
    
    // Query campaigns where user is member (indexed query - fast!)
    const q = query(
      collection(firestore, 'campaigns'),
      where('memberIds', 'array-contains', user.uid)
    );
    
    const unsubscribe = onSnapshot(q, snapshot => {
      setCampaigns(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [user, firestore]);
  
  return { campaigns, loading };
}
```

**Benefits:**
- One query, real-time updates
- No data duplication
- Simple and maintainable
- Scales well with proper Firestore indexes

### 2. Create a `useUserCharacters` Hook

```javascript
export function useUserCharacters() {
  const { user, firestore } = useFirebase();
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!user || !firestore) return;
    
    // Use collection group query to find all user's characters
    const q = query(
      collectionGroup(firestore, 'characters'),
      where('userId', '==', user.uid)
    );
    
    const unsubscribe = onSnapshot(q, snapshot => {
      setCharacters(snapshot.docs.map(doc => ({
        id: doc.id,
        campaignId: doc.ref.parent.parent.id, // Extract campaign ID from path
        ...doc.data()
      })));
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [user, firestore]);
  
  return { characters, loading };
}
```

### 3. Implement Profile Page with Hooks

```javascript
function ProfilePage() {
  const { profile } = useUserProfile();
  const { campaigns } = useCampaignsList();
  const { characters } = useUserCharacters();
  
  return (
    <div>
      <h1>{profile.username}'s Profile</h1>
      
      <section>
        <h2>Campaigns ({campaigns.length})</h2>
        {campaigns.map(campaign => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </section>
      
      <section>
        <h2>Characters ({characters.length})</h2>
        {characters.map(character => (
          <CharacterCard key={character.id} character={character} />
        ))}
      </section>
    </div>
  );
}
```

**Performance:**
- 3 real-time listeners (profile, campaigns, characters)
- Total reads: 1 profile + N campaigns + M characters
- Only fetched when profile page is visited
- Cached by React hooks until component unmounts
- Real-time updates automatically propagate

### 4. Add Client-Side Caching (Future Enhancement)

```javascript
// Use React Query or SWR for advanced caching
const { campaigns } = useQuery('user-campaigns', fetchCampaigns, {
  staleTime: 5 * 60 * 1000,  // 5 minutes
  cacheTime: 30 * 60 * 1000, // 30 minutes
  refetchOnWindowFocus: true
});
```

---

## Firestore Indexing Strategy

To make queries fast, ensure these indexes exist:

```javascript
// Composite index for campaigns query
campaigns
  memberIds (ARRAY) ASC
  createdAt DESC

// Composite index for characters query (if needed)
characters
  userId ASC
  createdAt DESC
```

**With proper indexes:**
- Campaign query: ~50ms even with 100 campaigns
- Character query: ~50ms even with 100 characters
- Total profile page load: ~150ms (3 parallel queries)

---

## Cost Comparison: Real Numbers

### Scenario: User with 10 campaigns, 20 characters

**Normalized (Current) - Viewing Profile:**
```
Firestore Reads:
- 1 read: userProfiles/{userId} (5KB)
- 10 reads: campaigns where member
- 20 reads: characters where userId
Total: 31 reads

Cost: 31 reads × $0.06 per 100k reads = negligible
```

**Denormalized (Proposed) - Viewing Profile:**
```
Firestore Reads:
- 1 read: userProfiles/{userId} (150KB with embedded data)
Total: 1 read

Cost: 1 read × $0.06 per 100k reads = negligible

BUT...
```

**Denormalized - Updating Campaign Name:**
```
Firestore Writes:
- 1 write: campaigns/{campaignId}
- 1 write: userProfiles/{dmId} (150KB)
- 5 writes: userProfiles/{member} (150KB each)
Total: 7 writes

Cost: 7 writes × $0.18 per 100k writes = more expensive

PLUS: Higher chance of write conflicts and failures
PLUS: Must handle sync failures and inconsistencies
```

**Verdict:** Denormalization doesn't save money at scale, and adds massive complexity.

---

## Decision Matrix

| Criteria | Normalized (Current) | Denormalized (Proposed) |
|----------|---------------------|-------------------------|
| **Data Consistency** | ✅ Single source of truth | ❌ Multiple copies, sync issues |
| **Document Size** | ✅ Small (~5KB profile) | ❌ Large (~150KB+, approaching limits) |
| **Write Complexity** | ✅ Simple, atomic | ❌ Complex, multi-document |
| **Query Performance** | ✅ Fast with indexes | ✅ Fast (single doc) |
| **Maintenance** | ✅ Simple | ❌ Complex |
| **Real-time Updates** | ✅ Simple listeners | ❌ Complex diffing |
| **Security** | ✅ Clear boundaries | ❌ Data leakage risk |
| **Scalability** | ✅ Unlimited growth | ❌ 1MB document limit |
| **Cost (reads)** | ✅ Only pay for what you fetch | ⚠️ Always transfer full doc |
| **Cost (writes)** | ✅ Update only what changed | ❌ Update entire profile |

---

## Recommendation: Keep Current Architecture ✅

### What We Should Do Instead:

1. ✅ **Use Firestore indexes** - Ensure queries are fast
2. ✅ **Create convenience hooks** - `useCampaignsList()`, `useUserCharacters()`
3. ✅ **Add profile page feature** - Use hooks to display campaigns/characters
4. ✅ **Implement client-side caching** - React Query or SWR for advanced caching
5. ✅ **Monitor performance** - Track query times and optimize indexes

### What We Should NOT Do:

1. ❌ Denormalize campaigns into user profiles
2. ❌ Denormalize characters into user profiles
3. ❌ Create data duplication and sync complexity
4. ❌ Approach document size limits

---

## Summary

**Your instinct to optimize performance is excellent!** But in this case:

- ✅ **Profile page feature is great** - Let's build it!
- ❌ **Denormalization is not the right solution** - Too many downsides

The better approach is:
1. Keep data normalized (current architecture)
2. Use indexed queries for fast fetches
3. Create hooks for convenient access
4. Add client-side caching if needed

**The current architecture is actually optimal for your use case.** Firestore is designed for this exact pattern - normalized data with indexed queries. The performance is excellent when indexes are configured correctly.

---

## Final Verdict

**I DISAGREE with denormalizing campaign/character data into profiles.**

The complexity, maintenance burden, and risk of data inconsistency far outweigh the marginal performance gains. The current normalized approach is:
- More reliable
- More maintainable
- More scalable
- More secure
- Still very fast with proper indexes

Let's build the profile page feature using the normalized approach! 🎯
