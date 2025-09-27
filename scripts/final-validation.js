#!/usr/bin/env node

/**
 * Final Validation for Phase 3.1 Migration Planning
 * Streamlined validation focusing on core migration readiness
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Final Migration Readiness Validation\n');

async function runCoreValidation() {
  let allPassed = true;
  
  const tests = [
    {
      name: 'V2 Implementation Tests',
      command: 'npm test -- src/hooks/__tests__/useAutoScrollV2.test.js --watchAll=false --silent',
      timeout: 30000
    },
    {
      name: 'A/B Comparison Tests', 
      command: 'npm test -- src/hooks/__tests__/useAutoScroll.ab-comparison.test.js --watchAll=false --silent',
      timeout: 30000
    },
    {
      name: 'A/B Integration Check',
      command: 'node scripts/validate-ab-integration.js',
      timeout: 15000
    }
  ];

  for (const test of tests) {
    try {
      console.log(`   Running ${test.name}...`);
      execSync(test.command, { 
        stdio: 'pipe', 
        timeout: test.timeout 
      });
      console.log(`   ✅ ${test.name}: PASSED`);
    } catch (error) {
      console.log(`   ❌ ${test.name}: FAILED`);
      console.log(`      Error: ${error.message.slice(0, 100)}...`);
      allPassed = false;
    }
  }

  return allPassed;
}

function validateFileStructure() {
  console.log('\n📁 Validating File Structure...\n');
  
  const requiredFiles = [
    'src/hooks/useAutoScrollV2.js',
    'src/components/ChatRoom/ChatRoom.js',
    'deployment-configs/.env.production-gradual',
    'scripts/monitor-migration.js',
    'scripts/emergency-rollback.js',
    'docs/phase-3-migration-plan.md'
  ];

  let allExists = true;
  
  requiredFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`   ${exists ? '✅' : '❌'} ${file}: ${exists ? 'EXISTS' : 'MISSING'}`);
    if (!exists) allExists = false;
  });

  return allExists;
}

async function main() {
  try {
    console.log('Starting Final Validation for Migration Readiness...\n');

    // Core functionality tests
    const testsPass = await runCoreValidation();
    
    // File structure validation
    const filesExist = validateFileStructure();
    
    console.log('\n📊 Final Validation Results:');
    console.log(`   Core Tests: ${testsPass ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log(`   File Structure: ${filesExist ? 'COMPLETE ✅' : 'INCOMPLETE ❌'}`);
    
    const overallReady = testsPass && filesExist;
    
    console.log(`\n🎯 Migration Readiness: ${overallReady ? 'READY FOR DEPLOYMENT ✅' : 'NEEDS ATTENTION ❌'}`);

    if (overallReady) {
      console.log('\n🚀 ALL SYSTEMS GO!');
      console.log('\nPhase 3.1 COMPLETE - Ready for Phase 3.2: Gradual Rollout');
      console.log('\nNext steps:');
      console.log('1. Copy deployment-configs/.env.production-gradual to production');
      console.log('2. Deploy with 10% V2 rollout');
      console.log('3. Monitor with scripts/monitor-migration.js');
      console.log('4. Gradually increase rollout percentage');
      
      // Create final completion marker
      const completionReport = `# Phase 3.1: COMPLETE ✅

**Date**: ${new Date().toISOString()}  
**Status**: READY FOR DEPLOYMENT  
**Validation**: ALL PASSED

## Readiness Checklist
- ✅ V2 Implementation Tests: PASSED
- ✅ A/B Comparison Tests: PASSED  
- ✅ A/B Integration: VALIDATED
- ✅ File Structure: COMPLETE
- ✅ Environment Configs: CREATED
- ✅ Monitoring Tools: READY
- ✅ Rollback Procedures: PREPARED

## 🚀 Ready for Phase 3.2: Gradual Rollout

### Quick Start:
\`\`\`bash
# 1. Use gradual rollout configuration
cp deployment-configs/.env.production-gradual .env.production

# 2. Deploy to production (10% V2 users)
# Your deployment commands here...

# 3. Monitor migration health
node scripts/monitor-migration.js

# 4. If issues arise, rollback immediately  
node scripts/emergency-rollback.js "reason"
\`\`\`

---
**Phase 3.1 Migration Planning: SUCCESSFULLY COMPLETED**
`;

      fs.writeFileSync('docs/phase-3-1-FINAL-COMPLETE.md', completionReport);
      console.log('\n📄 Completion report: docs/phase-3-1-FINAL-COMPLETE.md');
      
      process.exit(0);
    } else {
      console.log('\n⚠️  Issues found - address before proceeding');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Validation error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}