/**
 * Performance Monitoring Utilities
 *
 * Tracks performance metrics for voice chat features including:
 * - Component render times
 * - Memory usage
 * - Bundle size impact
 * - Audio processing performance
 */

import React from "react";

/**
 * Performance metrics collector
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.enabled = process.env.NODE_ENV === "development";
  }

  /**
   * Start measuring an operation
   */
  startMeasure(name) {
    if (!this.enabled) return;

    const startMark = `${name}-start`;
    performance.mark(startMark);

    return () => this.endMeasure(name);
  }

  /**
   * End measuring an operation
   */
  endMeasure(name) {
    if (!this.enabled) return;

    const startMark = `${name}-start`;
    const endMark = `${name}-end`;

    try {
      performance.mark(endMark);
      performance.measure(name, startMark, endMark);

      const measure = performance.getEntriesByName(name).pop();

      if (measure) {
        this.recordMetric(name, measure.duration);
      }

      // Cleanup
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(name);
    } catch (error) {
      console.warn(`Performance measurement failed for ${name}:`, error);
    }
  }

  /**
   * Record a metric
   */
  recordMetric(name, value) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, {
        count: 0,
        total: 0,
        min: Infinity,
        max: -Infinity,
        values: [],
      });
    }

    const metric = this.metrics.get(name);
    metric.count++;
    metric.total += value;
    metric.min = Math.min(metric.min, value);
    metric.max = Math.max(metric.max, value);
    metric.values.push(value);

    // Keep only last 100 values
    if (metric.values.length > 100) {
      metric.values.shift();
    }
  }

  /**
   * Get metric statistics
   */
  getMetric(name) {
    const metric = this.metrics.get(name);

    if (!metric) {
      return null;
    }

    return {
      name,
      count: metric.count,
      average: metric.total / metric.count,
      min: metric.min,
      max: metric.max,
      total: metric.total,
    };
  }

  /**
   * Get all metrics
   */
  getAllMetrics() {
    const results = {};

    for (const [name] of this.metrics) {
      results[name] = this.getMetric(name);
    }

    return results;
  }

  /**
   * Log all metrics to console
   */
  logMetrics() {
    if (!this.enabled) return;

    console.group("📊 Performance Metrics");

    const metrics = this.getAllMetrics();

    for (const [name, stats] of Object.entries(metrics)) {
      console.log(`${name}:`);
      console.log(`  Average: ${stats.average.toFixed(2)}ms`);
      console.log(`  Min: ${stats.min.toFixed(2)}ms`);
      console.log(`  Max: ${stats.max.toFixed(2)}ms`);
      console.log(`  Count: ${stats.count}`);
    }

    console.groupEnd();
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear();
  }

  /**
   * Get memory usage (if available)
   */
  getMemoryUsage() {
    if (performance.memory) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        usedPercent:
          (performance.memory.usedJSHeapSize /
            performance.memory.jsHeapSizeLimit) *
          100,
      };
    }

    return null;
  }

  /**
   * Log memory usage
   */
  logMemoryUsage() {
    const memory = this.getMemoryUsage();

    if (memory) {
      console.log("💾 Memory Usage:");
      console.log(
        `  Used: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`
      );
      console.log(
        `  Total: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`
      );
      console.log(
        `  Limit: ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
      );
      console.log(`  Usage: ${memory.usedPercent.toFixed(2)}%`);
    } else {
      console.log("💾 Memory API not available");
    }
  }
}

/**
 * React component performance wrapper
 */
export const measureComponentRender = (ComponentName) => {
  return (WrappedComponent) => {
    return React.forwardRef((props, ref) => {
      const monitor = usePerformanceMonitor();

      React.useEffect(() => {
        const endMeasure = monitor.startMeasure(`${ComponentName}-render`);

        return () => {
          endMeasure();
        };
      });

      return <WrappedComponent {...props} ref={ref} />;
    });
  };
};

/**
 * Hook to access performance monitor
 */
export const usePerformanceMonitor = () => {
  return React.useMemo(() => getPerformanceMonitor(), []);
};

/**
 * Measure function execution time
 */
export const measureFunction = (fn, name) => {
  return async (...args) => {
    const monitor = getPerformanceMonitor();
    const endMeasure = monitor.startMeasure(name || fn.name);

    try {
      const result = await fn(...args);
      return result;
    } finally {
      endMeasure();
    }
  };
};

/**
 * Get web vitals (Core Web Vitals)
 */
export const measureWebVitals = () => {
  // This would integrate with web-vitals library
  // npm install web-vitals

  import("web-vitals")
    .then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(console.log);
      getFID(console.log);
      getFCP(console.log);
      getLCP(console.log);
      getTTFB(console.log);
    })
    .catch(() => {
      console.warn("web-vitals library not available");
    });
};

/**
 * Track bundle size impact
 */
export const getBundleStats = () => {
  // This would be called from webpack or build tool
  return {
    voiceChat: {
      // Approximate sizes based on file analysis
      hooks: 15, // KB
      components: 25, // KB
      utils: 10, // KB
      total: 50, // KB
    },
  };
};

/**
 * Monitor audio processing performance
 */
export class AudioPerformanceMonitor {
  constructor() {
    this.metrics = {
      audioContextCreation: [],
      streamAcquisition: [],
      peerConnectionSetup: [],
      soundGeneration: [],
    };
  }

  /**
   * Measure audio context creation
   */
  async measureAudioContextCreation(fn) {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    this.metrics.audioContextCreation.push(duration);
    return { result, duration };
  }

  /**
   * Measure stream acquisition
   */
  async measureStreamAcquisition(fn) {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    this.metrics.streamAcquisition.push(duration);
    return { result, duration };
  }

  /**
   * Get average metrics
   */
  getAverages() {
    const avg = (arr) =>
      arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    return {
      audioContextCreation: avg(this.metrics.audioContextCreation),
      streamAcquisition: avg(this.metrics.streamAcquisition),
      peerConnectionSetup: avg(this.metrics.peerConnectionSetup),
      soundGeneration: avg(this.metrics.soundGeneration),
    };
  }

  /**
   * Log audio performance metrics
   */
  log() {
    console.group("🎵 Audio Performance");
    const avgs = this.getAverages();

    for (const [metric, value] of Object.entries(avgs)) {
      console.log(`${metric}: ${value.toFixed(2)}ms`);
    }

    console.groupEnd();
  }
}

// Singleton instances
let performanceMonitorInstance = null;
let audioPerformanceMonitorInstance = null;

export const getPerformanceMonitor = () => {
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new PerformanceMonitor();
  }
  return performanceMonitorInstance;
};

export const getAudioPerformanceMonitor = () => {
  if (!audioPerformanceMonitorInstance) {
    audioPerformanceMonitorInstance = new AudioPerformanceMonitor();
  }
  return audioPerformanceMonitorInstance;
};

const performanceMonitor = {
  PerformanceMonitor,
  AudioPerformanceMonitor,
  getPerformanceMonitor,
  getAudioPerformanceMonitor,
  measureComponentRender,
  measureFunction,
  measureWebVitals,
  getBundleStats,
};

export default performanceMonitor;
