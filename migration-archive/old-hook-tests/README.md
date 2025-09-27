# Migration Archive: Old Hook Tests

This directory contains test files for deprecated hooks that were replaced during Phase 2 of the refactoring process.

## Archived Files

### useAutoScrollV2 Tests (Replaced by useUnifiedScrollManager)
- `useAutoScrollV2.test.js` - Core functionality tests for the V2 auto-scroll implementation
- `useAutoScrollV2.regressionTests.test.js` - Regression tests for scroll edge cases
- `useAutoScrollV2.debug.test.js` - Debug-specific tests for development

### useScrollPrependRestoration Tests (Merged into useUnifiedScrollManager)
- `useScrollPrependRestoration.test.js` - Tests for pagination scroll restoration logic

## Why These Were Archived

During **Phase 2: Hook Reduction**, these hooks were consolidated into a single `useUnifiedScrollManager` that combines their functionality:

- **useAutoScrollV2** + **useScrollPrependRestoration** → **useUnifiedScrollManager**

This eliminated conflicts between the two scroll systems and reduced complexity while maintaining all functionality.

## New Test Coverage

The functionality of these deprecated hooks is now covered by:
- `src/hooks/__tests__/useUnifiedScrollManager.test.js` - Comprehensive tests for the unified scroll system
- `src/components/ChatRoom/__tests__/ChatRoom.loadingIndicator.test.js` - Integration tests updated for new hook

## Status

These tests are preserved for reference but are no longer part of the active test suite. The old hooks themselves have been removed from the codebase.

**Archive Date**: Phase 2 completion
**Replaced By**: useUnifiedScrollManager
**Status**: ✅ Successfully migrated, all functionality preserved