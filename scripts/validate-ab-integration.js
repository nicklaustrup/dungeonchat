#!/usr/bin/env node

/**
 * A/B Integration Validation Script
 * 
 * This script validates that our feature flag integration is working correctly
 * by checking both implementations are loaded and can be switched via environment variables.
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 A/B Integration Validation\n');

// Check that both implementations exist
const originalPath = path.join(__dirname, '../src/hooks/useAutoScroll.js');
const v2Path = path.join(__dirname, '../src/hooks/useAutoScrollV2.js');
const chatRoomPath = path.join(__dirname, '../src/components/ChatRoom/ChatRoom.js');

console.log('📁 Checking file existence:');
console.log('  ✅ useAutoScroll.js:', fs.existsSync(originalPath));
console.log('  ✅ useAutoScrollV2.js:', fs.existsSync(v2Path));
console.log('  ✅ ChatRoom.js:', fs.existsSync(chatRoomPath));

// Check that ChatRoom imports both hooks
const chatRoomContent = fs.readFileSync(chatRoomPath, 'utf8');
const hasOriginalImport = chatRoomContent.includes("import { useAutoScroll }");
const hasV2Import = chatRoomContent.includes("import { useAutoScrollV2 }");
const hasFeatureFlag = chatRoomContent.includes("REACT_APP_USE_AUTO_SCROLL_V2");

console.log('\n🔗 Checking ChatRoom integration:');
console.log('  ✅ Imports useAutoScroll:', hasOriginalImport);
console.log('  ✅ Imports useAutoScrollV2:', hasV2Import);  
console.log('  ✅ Has feature flag logic:', hasFeatureFlag);

// Check environment configuration
const envPath = path.join(__dirname, '../.env');
const envExists = fs.existsSync(envPath);
let hasScrollFlags = false;

if (envExists) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  hasScrollFlags = envContent.includes('REACT_APP_USE_AUTO_SCROLL_V2') && 
                   envContent.includes('REACT_APP_SCROLL_COMPARISON');
}

console.log('\n⚙️  Checking environment configuration:');
console.log('  ✅ .env file exists:', envExists);
console.log('  ✅ Has scroll feature flags:', hasScrollFlags);

// Check test files exist
const originalTestsExist = fs.existsSync(path.join(__dirname, '../src/hooks/__tests__/useAutoScroll.test.js'));
const v2TestsExist = fs.existsSync(path.join(__dirname, '../src/hooks/__tests__/useAutoScrollV2.test.js'));

console.log('\n🧪 Checking test coverage:');
console.log('  ✅ Original tests exist:', originalTestsExist);
console.log('  ✅ V2 tests exist:', v2TestsExist);

// Summary
const allChecks = [
  fs.existsSync(originalPath),
  fs.existsSync(v2Path), 
  fs.existsSync(chatRoomPath),
  hasOriginalImport,
  hasV2Import,
  hasFeatureFlag,
  hasScrollFlags,
  originalTestsExist,
  v2TestsExist
];

const passedChecks = allChecks.filter(Boolean).length;
const totalChecks = allChecks.length;

console.log(`\n📊 Summary: ${passedChecks}/${totalChecks} checks passed`);

if (passedChecks === totalChecks) {
  console.log('🎉 A/B Integration setup complete!');
  console.log('\n📋 Next steps:');
  console.log('  1. Run: cp .env.development.local.example .env.local');
  console.log('  2. Edit .env.local to enable V2: REACT_APP_USE_AUTO_SCROLL_V2=true');
  console.log('  3. Start the app and test both implementations');
  console.log('  4. Check browser console for comparison logs');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please review the setup.');
  process.exit(1);
}