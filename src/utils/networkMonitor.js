/**
 * Network Quality Monitor
 *
 * Monitors network conditions and connection quality for voice chat.
 * Provides real-time feedback and adaptive quality adjustments.
 */

/**
 * Network quality levels
 */
export const NetworkQuality = {
  EXCELLENT: "excellent", // < 50ms latency, > 1Mbps
  GOOD: "good", // 50-150ms latency, 500Kbps-1Mbps
  FAIR: "fair", // 150-300ms latency, 250-500Kbps
  POOR: "poor", // > 300ms latency, < 250Kbps
  UNKNOWN: "unknown",
};

/**
 * Network monitoring class
 */
export class NetworkMonitor {
  constructor(options = {}) {
    this.callbacks = [];
    this.currentQuality = NetworkQuality.UNKNOWN;
    this.stats = {
      latency: null,
      bandwidth: null,
      packetLoss: null,
      jitter: null,
      lastUpdate: null,
    };

    this.updateInterval = options.updateInterval || 5000; // 5 seconds
    this.monitoringInterval = null;

    // Connection API support
    this.connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;
  }

  /**
   * Start monitoring network quality
   */
  start() {
    if (this.monitoringInterval) {
      return; // Already monitoring
    }

    // Initial check
    this.checkNetworkQuality();

    // Periodic checks
    this.monitoringInterval = setInterval(() => {
      this.checkNetworkQuality();
    }, this.updateInterval);

    // Listen to connection changes if available
    if (this.connection) {
      this.connection.addEventListener("change", () => {
        this.checkNetworkQuality();
      });
    }

    console.log("🌐 Network monitoring started");
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log("🌐 Network monitoring stopped");
  }

  /**
   * Check current network quality
   */
  async checkNetworkQuality() {
    try {
      // Get connection info if available
      if (this.connection) {
        // const effectiveType = this.connection.effectiveType;
        const downlink = this.connection.downlink; // Mbps
        const rtt = this.connection.rtt; // Round trip time in ms

        this.stats.bandwidth = downlink;
        this.stats.latency = rtt;
      }

      // Estimate quality based on available data
      const quality = this.estimateQuality();

      if (quality !== this.currentQuality) {
        const previousQuality = this.currentQuality;
        this.currentQuality = quality;

        console.log(
          `📊 Network quality changed: ${previousQuality} → ${quality}`
        );

        // Notify callbacks
        this.notifyCallbacks({
          quality,
          previousQuality,
          stats: { ...this.stats },
          timestamp: Date.now(),
        });
      }

      this.stats.lastUpdate = Date.now();
    } catch (error) {
      console.error("Network quality check failed:", error);
    }
  }

  /**
   * Estimate network quality based on stats
   */
  estimateQuality() {
    const { latency, bandwidth } = this.stats;

    // If we have both metrics
    if (latency !== null && bandwidth !== null) {
      if (latency < 50 && bandwidth > 1) {
        return NetworkQuality.EXCELLENT;
      } else if (latency < 150 && bandwidth > 0.5) {
        return NetworkQuality.GOOD;
      } else if (latency < 300 && bandwidth > 0.25) {
        return NetworkQuality.FAIR;
      } else {
        return NetworkQuality.POOR;
      }
    }

    // If we only have latency
    if (latency !== null) {
      if (latency < 50) return NetworkQuality.EXCELLENT;
      if (latency < 150) return NetworkQuality.GOOD;
      if (latency < 300) return NetworkQuality.FAIR;
      return NetworkQuality.POOR;
    }

    // If we only have bandwidth
    if (bandwidth !== null) {
      if (bandwidth > 1) return NetworkQuality.EXCELLENT;
      if (bandwidth > 0.5) return NetworkQuality.GOOD;
      if (bandwidth > 0.25) return NetworkQuality.FAIR;
      return NetworkQuality.POOR;
    }

    // Use connection type as fallback
    if (this.connection && this.connection.effectiveType) {
      const type = this.connection.effectiveType;
      if (type === "4g") return NetworkQuality.GOOD;
      if (type === "3g") return NetworkQuality.FAIR;
      if (type === "2g" || type === "slow-2g") return NetworkQuality.POOR;
    }

    return NetworkQuality.UNKNOWN;
  }

  /**
   * Register callback for quality changes
   */
  onChange(callback) {
    this.callbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify all callbacks
   */
  notifyCallbacks(data) {
    this.callbacks.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error("Network monitor callback error:", error);
      }
    });
  }

  /**
   * Get current quality
   */
  getQuality() {
    return this.currentQuality;
  }

  /**
   * Get current stats
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Get recommended audio quality based on network
   */
  getRecommendedAudioQuality() {
    switch (this.currentQuality) {
      case NetworkQuality.EXCELLENT:
      case NetworkQuality.GOOD:
        return "high";
      case NetworkQuality.FAIR:
        return "medium";
      case NetworkQuality.POOR:
        return "low";
      default:
        return "medium";
    }
  }

  /**
   * Check if network is suitable for voice chat
   */
  isSuitableForVoice() {
    return (
      this.currentQuality !== NetworkQuality.POOR &&
      this.currentQuality !== NetworkQuality.UNKNOWN
    );
  }
}

/**
 * Measure connection latency by pinging a server
 */
export const measureLatency = async (
  url = "https://www.google.com",
  attempts = 3
) => {
  const latencies = [];

  for (let i = 0; i < attempts; i++) {
    try {
      const start = performance.now();

      // Use fetch with no-cache to ensure fresh request
      await fetch(url, {
        method: "HEAD",
        mode: "no-cors",
        cache: "no-cache",
      });

      const end = performance.now();
      latencies.push(end - start);
    } catch (error) {
      console.warn(`Latency measurement attempt ${i + 1} failed:`, error);
    }
  }

  if (latencies.length === 0) {
    return null;
  }

  // Return average latency
  return latencies.reduce((a, b) => a + b, 0) / latencies.length;
};

/**
 * Test download speed (approximate)
 */
export const measureDownloadSpeed = async (testUrl, duration = 3000) => {
  try {
    const start = performance.now();
    const response = await fetch(testUrl, { cache: "no-cache" });
    const reader = response.body.getReader();

    let receivedBytes = 0;
    let startTime = performance.now();

    while (true) {
      const { done, value } = await reader.read();

      if (done || performance.now() - startTime > duration) {
        break;
      }

      receivedBytes += value.length;
    }

    const elapsed = (performance.now() - start) / 1000; // seconds
    const speedMbps = (receivedBytes * 8) / (elapsed * 1000000);

    return {
      speedMbps,
      bytes: receivedBytes,
      duration: elapsed,
    };
  } catch (error) {
    console.error("Download speed measurement failed:", error);
    return null;
  }
};

/**
 * Simulate network conditions (for testing)
 */
export const simulateNetworkConditions = (condition) => {
  const conditions = {
    good: {
      downloadThroughput: (1.5 * 1024 * 1024) / 8, // 1.5 Mbps in bytes
      uploadThroughput: (0.75 * 1024 * 1024) / 8, // 750 Kbps
      latency: 40,
      packetLoss: 0,
    },
    fair: {
      downloadThroughput: (0.4 * 1024 * 1024) / 8, // 400 Kbps
      uploadThroughput: (0.2 * 1024 * 1024) / 8, // 200 Kbps
      latency: 200,
      packetLoss: 2,
    },
    poor: {
      downloadThroughput: (0.2 * 1024 * 1024) / 8, // 200 Kbps
      uploadThroughput: (0.1 * 1024 * 1024) / 8, // 100 Kbps
      latency: 500,
      packetLoss: 5,
    },
  };

  return conditions[condition] || conditions.fair;
};

/**
 * Create singleton instance
 */
let networkMonitorInstance = null;

export const getNetworkMonitor = (options) => {
  if (!networkMonitorInstance) {
    networkMonitorInstance = new NetworkMonitor(options);
  }
  return networkMonitorInstance;
};

const networkMonitor = {
  NetworkMonitor,
  NetworkQuality,
  measureLatency,
  measureDownloadSpeed,
  simulateNetworkConditions,
  getNetworkMonitor,
};

export default networkMonitor;
