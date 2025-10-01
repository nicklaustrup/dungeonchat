/**
 * Connection Health Monitor
 * Monitors WebRTC connection quality and provides health metrics
 */

export class ConnectionHealthMonitor {
  constructor(peerConnection, userId) {
    this.pc = peerConnection;
    this.userId = userId;
    this.lastStats = null;
    this.monitoringInterval = null;
    this.onQualityChange = null;
  }

  /**
   * Start monitoring connection quality
   * @param {Function} callback - Called when quality changes
   * @param {number} interval - Monitoring interval in ms (default: 2000)
   */
  startMonitoring(callback, interval = 2000) {
    this.onQualityChange = callback;
    
    this.monitoringInterval = setInterval(async () => {
      try {
        const quality = await this.getConnectionQuality();
        if (callback) {
          callback(this.userId, quality);
        }
      } catch (error) {
        console.error('[ConnectionHealthMonitor] Error getting stats:', error);
      }
    }, interval);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Get current connection quality
   * @returns {Object} Quality metrics
   */
  async getConnectionQuality() {
    const stats = await this.getStats();
    const quality = this.calculateQuality(stats);
    
    return {
      quality: quality.level,
      details: {
        packetsLost: stats.packetsLost,
        packetsReceived: stats.packetsReceived,
        lossRate: quality.lossRate,
        jitter: stats.jitter,
        roundTripTime: stats.roundTripTime,
        bytesReceived: stats.bytesReceived
      }
    };
  }

  /**
   * Get WebRTC statistics
   * @returns {Object} Stats object
   */
  async getStats() {
    const stats = await this.pc.getStats();
    let audioStats = {
      packetsLost: 0,
      packetsReceived: 0,
      jitter: 0,
      roundTripTime: 0,
      bytesReceived: 0,
      timestamp: Date.now()
    };
    
    stats.forEach(report => {
      // Inbound audio stats
      if (report.type === 'inbound-rtp' && report.kind === 'audio') {
        audioStats.packetsLost = report.packetsLost || 0;
        audioStats.packetsReceived = report.packetsReceived || 0;
        audioStats.jitter = report.jitter || 0;
        audioStats.bytesReceived = report.bytesReceived || 0;
      }
      
      // Candidate pair stats for RTT
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        audioStats.roundTripTime = report.currentRoundTripTime || 0;
      }
    });
    
    this.lastStats = audioStats;
    return audioStats;
  }

  /**
   * Calculate connection quality based on stats
   * @param {Object} stats - Connection statistics
   * @returns {Object} Quality assessment
   */
  calculateQuality(stats) {
    const totalPackets = stats.packetsReceived + stats.packetsLost;
    const lossRate = totalPackets > 0 ? stats.packetsLost / totalPackets : 0;
    const jitterMs = stats.jitter * 1000; // Convert to milliseconds
    const rttMs = stats.roundTripTime * 1000;

    let level = 'excellent';
    let score = 100;

    // Packet loss penalties
    if (lossRate > 0.10) {
      level = 'poor';
      score -= 50;
    } else if (lossRate > 0.05) {
      level = 'fair';
      score -= 30;
    } else if (lossRate > 0.02) {
      level = 'good';
      score -= 15;
    }

    // Jitter penalties
    if (jitterMs > 100) {
      level = 'poor';
      score -= 30;
    } else if (jitterMs > 50) {
      if (level === 'excellent') level = 'good';
      score -= 15;
    } else if (jitterMs > 30) {
      score -= 5;
    }

    // RTT penalties
    if (rttMs > 300) {
      level = 'poor';
      score -= 20;
    } else if (rttMs > 200) {
      if (level === 'excellent') level = 'good';
      score -= 10;
    }

    return {
      level,
      score: Math.max(0, score),
      lossRate: (lossRate * 100).toFixed(2),
      jitterMs: jitterMs.toFixed(1),
      rttMs: rttMs.toFixed(1)
    };
  }

  /**
   * Check if connection is healthy
   * @returns {boolean} True if connection is healthy
   */
  async isHealthy() {
    const quality = await this.getConnectionQuality();
    return quality.quality !== 'poor';
  }

  /**
   * Get connection state
   * @returns {string} Connection state
   */
  getConnectionState() {
    return this.pc.connectionState;
  }

  /**
   * Get ICE connection state
   * @returns {string} ICE connection state
   */
  getIceConnectionState() {
    return this.pc.iceConnectionState;
  }
}

export default ConnectionHealthMonitor;
