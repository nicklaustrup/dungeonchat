/**
 * Browser Compatibility Tests
 * 
 * Tests for browser detection and feature support
 */

import {
  detectBrowser,
  checkWebRTCSupport,
  checkAudioAPISupport,
  checkVoiceChatCompatibility,
  getRecommendedRTCConfig,
  getRecommendedAudioConstraints
} from '../utils/browserCompatibility';

describe('Browser Detection', () => {
  const originalUserAgent = navigator.userAgent;
  
  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true
    });
  });
  
  test('detects Chrome browser', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      configurable: true
    });
    
    const browser = detectBrowser();
    expect(browser.name).toBe('Chrome');
    expect(browser.isChrome).toBe(true);
    expect(browser.isFirefox).toBe(false);
    expect(browser.isSafari).toBe(false);
  });
  
  test('detects Firefox browser', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
      configurable: true
    });
    
    const browser = detectBrowser();
    expect(browser.name).toBe('Firefox');
    expect(browser.isFirefox).toBe(true);
    expect(browser.isChrome).toBe(false);
  });
  
  test('detects Safari browser', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      configurable: true
    });
    
    const browser = detectBrowser();
    expect(browser.name).toBe('Safari');
    expect(browser.isSafari).toBe(true);
    expect(browser.isChrome).toBe(false);
  });
  
  test('detects Edge browser', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
      configurable: true
    });
    
    const browser = detectBrowser();
    expect(browser.name).toBe('Edge');
    expect(browser.isEdge).toBe(true);
  });
  
  test('detects mobile browsers', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      configurable: true
    });
    
    const browser = detectBrowser();
    expect(browser.isMobile).toBe(true);
    expect(browser.isSafari).toBe(true);
  });
});

describe('WebRTC Support', () => {
  test('checks WebRTC support in modern browser', () => {
    const support = checkWebRTCSupport();
    
    // In a test environment with jsdom, these may not be available
    // But we can test the structure
    expect(support).toHaveProperty('supported');
    expect(support).toHaveProperty('getUserMedia');
    expect(support).toHaveProperty('peerConnection');
    expect(support).toHaveProperty('mediaDevices');
  });
});

describe('Audio API Support', () => {
  test('checks Audio API support', () => {
    const support = checkAudioAPISupport();
    
    expect(support).toHaveProperty('supported');
    expect(support).toHaveProperty('oscillatorNode');
    expect(support).toHaveProperty('gainNode');
  });
});

describe('Voice Chat Compatibility', () => {
  test('returns comprehensive compatibility report', () => {
    const compat = checkVoiceChatCompatibility();
    
    expect(compat).toHaveProperty('compatible');
    expect(compat).toHaveProperty('browser');
    expect(compat).toHaveProperty('features');
    expect(compat).toHaveProperty('warnings');
    expect(compat).toHaveProperty('errors');
    expect(compat).toHaveProperty('recommendation');
    
    expect(Array.isArray(compat.warnings)).toBe(true);
    expect(Array.isArray(compat.errors)).toBe(true);
  });
  
  test('provides warnings for Safari', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      configurable: true
    });
    
    const compat = checkVoiceChatCompatibility();
    
    expect(compat.browser.isSafari).toBe(true);
    expect(compat.warnings.length).toBeGreaterThan(0);
    expect(compat.warnings.some(w => w.includes('Safari'))).toBe(true);
  });
});

describe('Recommended Configurations', () => {
  test('provides RTC config', () => {
    const config = getRecommendedRTCConfig();
    
    expect(config).toHaveProperty('iceServers');
    expect(Array.isArray(config.iceServers)).toBe(true);
    expect(config.iceServers.length).toBeGreaterThan(0);
  });
  
  test('provides different configs for different browsers', () => {
    // Test Firefox config
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 Firefox/120.0',
      configurable: true
    });
    
    const firefoxConfig = getRecommendedRTCConfig();
    expect(firefoxConfig).toHaveProperty('bundlePolicy');
    
    // Test Chrome config
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 Chrome/120.0',
      configurable: true
    });
    
    const chromeConfig = getRecommendedRTCConfig();
    // Chrome uses base config, no special properties
    expect(chromeConfig).toHaveProperty('iceServers');
  });
  
  test('provides audio constraints', () => {
    const constraints = getRecommendedAudioConstraints('high');
    
    expect(constraints).toHaveProperty('audio');
    expect(constraints).toHaveProperty('video');
    expect(constraints.video).toBe(false);
    expect(constraints.audio.echoCancellation).toBe(true);
  });
  
  test('adjusts quality for mobile', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0) Safari/604.1',
      configurable: true
    });
    
    const constraints = getRecommendedAudioConstraints('high');
    
    // Mobile should use medium quality
    expect(constraints.audio.sampleRate).toBe(32000);
  });
  
  test('supports different quality levels', () => {
    // Mock browser detection to return desktop browser
    const originalUserAgent = navigator.userAgent;
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      configurable: true
    });
    
    const low = getRecommendedAudioConstraints('low');
    const medium = getRecommendedAudioConstraints('medium');
    const high = getRecommendedAudioConstraints('high');
    
    expect(low.audio.sampleRate).toBe(16000);
    expect(medium.audio.sampleRate).toBe(32000);
    expect(high.audio.sampleRate).toBe(48000);
    
    // Restore
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true
    });
  });
});

describe('Error Conditions', () => {
  test('detects non-HTTPS context', () => {
    // Save original location
    const originalLocation = window.location;
    
    // Mock location with non-https
    delete window.location;
    window.location = {
      protocol: 'http:',
      hostname: 'example.com',
      href: 'http://example.com'
    };
    
    const compat = checkVoiceChatCompatibility();
    
    expect(compat.errors.some(e => e.includes('HTTPS'))).toBe(true);
    
    // Restore
    delete window.location;
    window.location = originalLocation;
  });
});
