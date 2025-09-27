#!/usr/bin/env node

/**
 * Emergency Rollback Script
 * Quickly reverts to V1 implementation in case of critical issues
 */

const fs = require('fs');

console.log('🚨 EMERGENCY ROLLBACK - Reverting to V1 Implementation\n');

function createRollbackEnv() {
  const rollbackConfig = `# EMERGENCY ROLLBACK CONFIGURATION
# Generated: ${new Date().toISOString()}
# Status: REVERTED TO V1

REACT_APP_USE_AUTO_SCROLL_V2=false
REACT_APP_SCROLL_COMPARISON=false

# Rollback reason: ${process.argv[2] || 'Manual rollback requested'}
`;

  fs.writeFileSync('.env.local', rollbackConfig);
  console.log('✅ Rollback configuration applied to .env.local');
}

function main() {
  const reason = process.argv[2] || 'Manual rollback requested';
  
  console.log('Rollback reason:', reason);
  console.log('\nExecuting rollback...');
  
  createRollbackEnv();
  
  console.log('\n🔄 ROLLBACK COMPLETE');
  console.log('\nNext steps:');
  console.log('1. Restart the application to apply changes');
  console.log('2. Monitor for stability');
  console.log('3. Investigate the root cause');
  console.log('4. Fix issues before attempting migration again');
}

if (require.main === module) {
  main();
}
