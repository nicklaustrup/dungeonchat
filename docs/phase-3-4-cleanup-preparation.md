# Phase 3.4: Cleanup Preparation Plan

## 🎯 Cleanup Objectives

After successful Phase 3.3 completion, Phase 3.4 will:
1. Remove V1 implementation (useAutoScroll.js)
2. Remove feature flag logic from ChatRoom component  
3. Clean up environment variables and configurations
4. Update documentation to reflect final state
5. Archive migration artifacts for future reference

## 📁 Files to Remove in Phase 3.4

### V1 Implementation:
- `src/hooks/useAutoScroll.js` (467 lines → DELETE)
- Any V1-specific test files (if separate from V2 tests)

### Feature Flag Logic:
- Remove A/B comparison code from `src/components/ChatRoom/ChatRoom.js`
- Simplify to use only V2 implementation
- Remove environment variable checks

### Configuration Cleanup:
- Remove `REACT_APP_USE_AUTO_SCROLL_V2` (no longer needed)
- Remove `REACT_APP_SCROLL_COMPARISON` (no longer needed)
- Clean up deployment configuration files

### Migration Artifacts:
- Archive (don't delete) migration documentation
- Archive deployment configurations for reference
- Keep monitoring scripts for future migrations

## 📊 Estimated Impact

### Code Reduction:
- **V1 Removal**: -467 lines
- **Feature Flag Cleanup**: -50-100 lines  
- **Total Reduction**: ~500+ lines of code eliminated

### Maintenance Benefits:
- Single implementation to maintain
- No feature flag complexity
- Simplified testing
- Cleaner architecture

## ⚠️ Prerequisites for Phase 3.4

Phase 3.4 cleanup can begin when:
- [ ] Phase 3.3 completed successfully
- [ ] V2 stable in production for 1+ weeks
- [ ] No outstanding issues with V2 implementation
- [ ] Team confidence in V2 as permanent solution
- [ ] Migration artifacts archived properly

---

**Phase 3.4 preparation complete. Execute after Phase 3.3 success.**
