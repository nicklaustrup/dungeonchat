import { collection, addDoc, doc, updateDoc, onSnapshot, deleteDoc, serverTimestamp, getDocs, query } from 'firebase/firestore';

// audioService manages a shared playlist / currently playing track for a campaign.
export const audioService = {
  subscribe(firestore, campaignId, callback) {
    const col = collection(firestore, 'campaigns', campaignId, 'audio');
    return onSnapshot(col, snap => {
      const tracks = [];
      snap.forEach(d => tracks.push({ id: d.id, ...d.data() }));
      callback(tracks.sort((a,b)=> (a.order||0)-(b.order||0)));
    });
  },
  async addTrack(firestore, campaignId, track) {
    const col = collection(firestore, 'campaigns', campaignId, 'audio');
    await addDoc(col, {
      title: track.title || 'Untitled',
      url: track.url,
      volume: track.volume ?? 1,
      loop: !!track.loop,
      isPlaying: false,
      order: track.order ?? Date.now(),
      createdAt: serverTimestamp()
    });
  },
  async updateTrack(firestore, campaignId, trackId, updates) {
    const ref = doc(firestore, 'campaigns', campaignId, 'audio', trackId);
    await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
  },
  async deleteTrack(firestore, campaignId, trackId) {
    const ref = doc(firestore, 'campaigns', campaignId, 'audio', trackId);
    await deleteDoc(ref);
  },
  async playExclusive(firestore, campaignId, trackId) {
    // stop all others, then play this one
    const col = collection(firestore, 'campaigns', campaignId, 'audio');
    const snap = await getDocs(query(col));
    const batchOps = [];
    await Promise.all(snap.docs.map(async d => {
      if (d.id === trackId) return;
      const data = d.data();
      if (data.isPlaying) {
        batchOps.push(this.updateTrack(firestore, campaignId, d.id, { isPlaying: false }));
      }
    }));
    await Promise.all(batchOps);
    await this.updateTrack(firestore, campaignId, trackId, { isPlaying: true });
  },
  async stopTrack(firestore, campaignId, trackId) {
    await this.updateTrack(firestore, campaignId, trackId, { isPlaying: false });
  }
};
