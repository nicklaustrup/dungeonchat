# Husky CI Deployment Fix

## Problem
The GitHub Actions deployment was failing with:
```
sh: 1: husky: not found
npm error code 127
npm error command failed
npm error command sh -c husky install
```

This happened because:
1. The `prepare` script in `package.json` runs `husky install` automatically after `npm ci`
2. In CI environments, Husky is not needed (no Git hooks should run)
3. Husky was not installed as it's a dev dependency and deployment uses `--omit=dev`

## Solution Applied

### 1. Updated `package.json` prepare script
**Before:**
```json
"prepare": "husky install"
```

**After:**
```json
"prepare": "husky install 2>/dev/null || true"
```

This ensures the script never fails, even if husky is not available.

### 2. Updated GitHub Actions workflows
Added `--ignore-scripts` flag to prevent the prepare script from running during deployment:

**Files updated:**
- `.github/workflows/deploy.yml`
- `.github/workflows/tag-deploy.yml`

**Changes:**
```yaml
# Before
run: npm ci --omit=dev

# After  
run: npm ci --omit=dev --ignore-scripts
```

## Benefits
✅ **Deployments no longer fail** due to missing Husky
✅ **Faster CI builds** (skips unnecessary prepare script)
✅ **Husky still works locally** for developers
✅ **No breaking changes** to local development workflow

## Testing
- ✅ `CI=true npm run prepare` - works without errors
- ✅ `npm run prepare` - works locally (when Husky available)
- ✅ Deployment workflows updated to use `--ignore-scripts`

The fix is backward compatible and maintains the existing Git hooks functionality for local development while preventing CI deployment failures.