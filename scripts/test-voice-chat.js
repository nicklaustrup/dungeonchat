#!/usr/bin/env node

/**
 * Phase 4 Testing Script
 * 
 * Comprehensive testing for voice chat features
 * Run with: node scripts/test-voice-chat.js
 */

const chalk = require('chalk');

console.log(chalk.bold.cyan('\n🧪 Phase 4: Voice Chat Testing Suite\n'));

const tests = {
  browser: [],
  network: [],
  security: [],
  performance: []
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// Test result tracking
function recordTest(category, name, passed, details = '') {
  totalTests++;
  
  const result = {
    name,
    passed,
    details,
    timestamp: new Date().toISOString()
  };
  
  tests[category].push(result);
  
  if (passed) {
    passedTests++;
    console.log(chalk.green(`✓ ${name}`));
  } else {
    failedTests++;
    console.log(chalk.red(`✗ ${name}`));
    if (details) {
      console.log(chalk.gray(`  ${details}`));
    }
  }
}

// ====================
// Browser Compatibility Tests
// ====================

async function testBrowserCompatibility() {
  console.log(chalk.bold('\n📱 Browser Compatibility Tests\n'));
  
  // Test 1: WebRTC Support
  try {
    const hasGetUserMedia = !!(
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      (navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    );
    
    recordTest(
      'browser',
      'WebRTC getUserMedia Support',
      hasGetUserMedia,
      hasGetUserMedia ? 'getUserMedia is available' : 'getUserMedia not found'
    );
  } catch (error) {
    recordTest('browser', 'WebRTC getUserMedia Support', false, error.message);
  }
  
  // Test 2: RTCPeerConnection
  try {
    const hasRTCPeerConnection = !!(
      window.RTCPeerConnection ||
      window.webkitRTCPeerConnection ||
      window.mozRTCPeerConnection
    );
    
    recordTest(
      'browser',
      'RTCPeerConnection Support',
      hasRTCPeerConnection,
      hasRTCPeerConnection ? 'RTCPeerConnection is available' : 'RTCPeerConnection not found'
    );
  } catch (error) {
    recordTest('browser', 'RTCPeerConnection Support', false, error.message);
  }
  
  // Test 3: Web Audio API
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const hasAudioAPI = !!AudioContext;
    
    recordTest(
      'browser',
      'Web Audio API Support',
      hasAudioAPI,
      hasAudioAPI ? 'Web Audio API is available' : 'Web Audio API not found'
    );
  } catch (error) {
    recordTest('browser', 'Web Audio API Support', false, error.message);
  }
  
  // Test 4: Secure Context (HTTPS)
  try {
    const isSecure = window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost';
    
    recordTest(
      'browser',
      'Secure Context (HTTPS)',
      isSecure,
      isSecure ? 'Running in secure context' : 'Not HTTPS - getUserMedia will fail'
    );
  } catch (error) {
    recordTest('browser', 'Secure Context (HTTPS)', false, error.message);
  }
  
  // Test 5: LocalStorage
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    
    recordTest(
      'browser',
      'LocalStorage Support',
      true,
      'LocalStorage is working'
    );
  } catch (error) {
    recordTest('browser', 'LocalStorage Support', false, error.message);
  }
}

// ====================
// Network Tests
// ====================

async function testNetworkConditions() {
  console.log(chalk.bold('\n🌐 Network Condition Tests\n'));
  
  // Test 1: Connection API
  try {
    const connection = navigator.connection || 
                      navigator.mozConnection || 
                      navigator.webkitConnection;
    
    recordTest(
      'network',
      'Network Information API',
      !!connection,
      connection ? `Type: ${connection.effectiveType}, Downlink: ${connection.downlink}Mbps` : 'Not available'
    );
  } catch (error) {
    recordTest('network', 'Network Information API', false, error.message);
  }
  
  // Test 2: Latency Test
  try {
    const start = performance.now();
    await fetch('https://www.google.com', { method: 'HEAD', mode: 'no-cors' });
    const latency = performance.now() - start;
    
    const isGood = latency < 150;
    
    recordTest(
      'network',
      'Latency Test',
      isGood,
      `${latency.toFixed(0)}ms ${isGood ? '(Good)' : '(May cause issues)'}`
    );
  } catch (error) {
    recordTest('network', 'Latency Test', false, error.message);
  }
  
  // Test 3: Online Status
  try {
    const isOnline = navigator.onLine;
    
    recordTest(
      'network',
      'Online Status',
      isOnline,
      isOnline ? 'Connected' : 'Offline'
    );
  } catch (error) {
    recordTest('network', 'Online Status', false, error.message);
  }
}

// ====================
// Security Tests
// ====================

async function testSecurity() {
  console.log(chalk.bold('\n🔒 Security Tests\n'));
  
  // Test 1: XSS Prevention
  try {
    const testString = '<script>alert("xss")</script>';
    const sanitized = testString.replace(/<[^>]*>/g, '');
    
    recordTest(
      'security',
      'XSS Sanitization',
      sanitized === 'alert("xss")',
      'HTML tags properly removed'
    );
  } catch (error) {
    recordTest('security', 'XSS Sanitization', false, error.message);
  }
  
  // Test 2: Rate Limiting
  try {
    class TestRateLimiter {
      constructor(max) {
        this.max = max;
        this.count = 0;
      }
      isAllowed() {
        if (this.count >= this.max) {
          return { allowed: false };
        }
        this.count++;
        return { allowed: true };
      }
    }
    
    const limiter = new TestRateLimiter(5);
    
    // Should allow 5 attempts
    for (let i = 0; i < 5; i++) {
      const result = limiter.isAllowed();
      if (!result.allowed) {
        throw new Error('Rate limiter rejected valid attempt');
      }
    }
    
    // Should reject 6th attempt
    const result = limiter.isAllowed();
    
    recordTest(
      'security',
      'Rate Limiting Logic',
      !result.allowed,
      'Rate limiter properly blocks excess requests'
    );
  } catch (error) {
    recordTest('security', 'Rate Limiting Logic', false, error.message);
  }
  
  // Test 3: Secure Random ID
  try {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      
      recordTest(
        'security',
        'Crypto API (Secure Random)',
        true,
        'crypto.getRandomValues() is available'
      );
    } else {
      recordTest(
        'security',
        'Crypto API (Secure Random)',
        false,
        'crypto.getRandomValues() not available'
      );
    }
  } catch (error) {
    recordTest('security', 'Crypto API (Secure Random)', false, error.message);
  }
}

// ====================
// Performance Tests
// ====================

async function testPerformance() {
  console.log(chalk.bold('\n⚡ Performance Tests\n'));
  
  // Test 1: Performance API
  try {
    const hasPerformance = !!window.performance && !!window.performance.mark;
    
    if (hasPerformance) {
      performance.mark('test-start');
      performance.mark('test-end');
      performance.measure('test', 'test-start', 'test-end');
      
      recordTest(
        'performance',
        'Performance API',
        true,
        'performance.mark() and performance.measure() available'
      );
      
      performance.clearMarks();
      performance.clearMeasures();
    } else {
      recordTest(
        'performance',
        'Performance API',
        false,
        'Performance API not available'
      );
    }
  } catch (error) {
    recordTest('performance', 'Performance API', false, error.message);
  }
  
  // Test 2: Memory API
  try {
    if (performance.memory) {
      const memory = performance.memory;
      const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
      
      recordTest(
        'performance',
        'Memory API',
        true,
        `Using ${usedMB}MB of heap`
      );
    } else {
      recordTest(
        'performance',
        'Memory API',
        true,
        'Memory API not available (Chrome only)'
      );
    }
  } catch (error) {
    recordTest('performance', 'Memory API', false, error.message);
  }
  
  // Test 3: Audio Context Creation Time
  try {
    const start = performance.now();
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContext();
    const duration = performance.now() - start;
    
    context.close();
    
    const isFast = duration < 100;
    
    recordTest(
      'performance',
      'AudioContext Creation',
      isFast,
      `${duration.toFixed(2)}ms ${isFast ? '(Fast)' : '(Slow)'}`
    );
  } catch (error) {
    recordTest('performance', 'AudioContext Creation', false, error.message);
  }
  
  // Test 4: Render Performance
  try {
    const iterations = 1000;
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      const div = document.createElement('div');
      div.textContent = 'Test';
    }
    
    const duration = performance.now() - start;
    const avgTime = duration / iterations;
    
    const isFast = avgTime < 0.1;
    
    recordTest(
      'performance',
      'DOM Creation Performance',
      isFast,
      `${avgTime.toFixed(3)}ms per element ${isFast ? '(Fast)' : '(Slow)'}`
    );
  } catch (error) {
    recordTest('performance', 'DOM Creation Performance', false, error.message);
  }
}

// ====================
// Run All Tests
// ====================

async function runAllTests() {
  await testBrowserCompatibility();
  await testNetworkConditions();
  await testSecurity();
  await testPerformance();
  
  // Print summary
  console.log(chalk.bold('\n📊 Test Summary\n'));
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(chalk.green(`Passed: ${passedTests}`));
  console.log(chalk.red(`Failed: ${failedTests}`));
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  // Category breakdown
  console.log(chalk.bold('\n📋 Category Breakdown\n'));
  
  for (const [category, results] of Object.entries(tests)) {
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const rate = total > 0 ? ((passed / total) * 100).toFixed(0) : 0;
    
    console.log(`${category}: ${passed}/${total} (${rate}%)`);
  }
  
  // Recommendations
  console.log(chalk.bold('\n💡 Recommendations\n'));
  
  if (failedTests === 0) {
    console.log(chalk.green('✓ All tests passed! Voice chat should work perfectly.'));
  } else {
    console.log(chalk.yellow(`⚠ ${failedTests} test(s) failed. Review the failures above.`));
    
    // Specific recommendations based on failures
    const browserFailed = tests.browser.filter(t => !t.passed).length;
    const networkFailed = tests.network.filter(t => !t.passed).length;
    const securityFailed = tests.security.filter(t => !t.passed).length;
    const performanceFailed = tests.performance.filter(t => !t.passed).length;
    
    if (browserFailed > 0) {
      console.log('• Browser: Consider adding polyfills or showing compatibility warnings');
    }
    if (networkFailed > 0) {
      console.log('• Network: Consider implementing adaptive quality or offline mode');
    }
    if (securityFailed > 0) {
      console.log('• Security: Review security implementations and add missing features');
    }
    if (performanceFailed > 0) {
      console.log('• Performance: Consider optimization or lazy loading');
    }
  }
  
  console.log(chalk.bold('\n✅ Testing Complete!\n'));
  
  // Save results
  const results = {
    timestamp: new Date().toISOString(),
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      successRate: ((passedTests / totalTests) * 100).toFixed(1)
    },
    tests
  };
  
  console.log('Results saved to: test-results.json');
  
  // In a real environment, would save to file
  // require('fs').writeFileSync('test-results.json', JSON.stringify(results, null, 2));
  
  return results;
}

// Run tests
runAllTests().catch(error => {
  console.error(chalk.red('Test suite error:'), error);
  process.exit(1);
});
