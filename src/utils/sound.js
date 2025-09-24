export const playNotificationSound = (soundEnabled) => {
    console.log('🔊 playNotificationSound called');
    console.log('🔊 soundEnabled:', soundEnabled);
    
    if (!soundEnabled) {
      console.log('🔇 Sound is disabled, returning early');
      return;
    }
    
    try {
      // Initialize AudioContext once and reuse it
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Create a simple notification sound using Web Audio API
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      
      console.log('✅ Sound played successfully');
    } catch (error) {
      console.error('❌ Error playing sound:', error);
    }
  };
