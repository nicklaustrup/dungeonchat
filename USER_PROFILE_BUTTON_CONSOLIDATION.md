# User Profile Button Consolidation

**Date**: October 3, 2025

## Overview
Consolidated the "View Profile" and "Edit Profile" buttons in the UserChip menu into a single "View Profile" button. Users can now edit their profile directly from the View Profile modal.

## Changes Made

### 1. UserMenu Component (`src/components/ChatHeader/UserMenu.js`)
- **Removed**: "Edit Profile" button from the menu
- **Updated**: "View Profile" button now opens the ProfileDisplay modal with inline editing capabilities
- **Handler Logic**: The `handleProfile` function now calls `onEditProfile` (which opens ProfileDisplay) instead of `onViewProfile`

### 2. ProfileDisplay Component (No Changes Required)
- Already supports inline editing of profile fields when viewing own profile
- Users can:
  - ✅ Click on profile picture to upload a new one
  - ✅ Edit bio with inline editor (click the ✏️ button)
  - ✅ Edit display name with inline editor (click the ✏️ button)
  - ✅ Each field has save/cancel buttons for individual edits

### 3. Test Updates (`src/tests/ChatHeader/UserMenu.test.js`)
- Updated test to look for "View Profile" button instead of "Edit Profile"
- Test now validates that clicking "View Profile" triggers the `onEditProfile` callback

## User Flow

### Before
1. Click user chip in header
2. Click "View Profile" → View-only modal (non-functional)
3. Click "Edit Profile" → Separate edit modal

### After
1. Click user chip in header
2. Click "View Profile" → Opens ProfileDisplay modal
3. When viewing own profile, inline edit buttons (✏️) appear on hover
4. Click edit button on any field to edit inline
5. Click profile picture to upload a new photo
6. Save or cancel each field individually

## Benefits
- ✅ **Simplified UX**: Single button instead of two confusing options
- ✅ **More intuitive**: View and edit in the same modal
- ✅ **Inline editing**: Edit individual fields without switching modals
- ✅ **Better discoverability**: Edit buttons appear contextually
- ✅ **Reduced confusion**: No more separate "View" vs "Edit" modes

## Technical Details

### ProfileDisplay Features
- **Profile Picture Upload**: Click anywhere on avatar to trigger file selector
- **Bio Editing**: 500 character limit with counter
- **Display Name Editing**: Optional full name field
- **Privacy Settings**: Can be edited inline if needed
- **Validation**: Username validation with availability checking
- **Auto-save**: Each field saves independently

### File Structure
```
src/
├── components/
│   ├── ChatHeader/
│   │   ├── UserMenu.js (Modified)
│   │   └── ChatHeader.js (Already wired correctly)
│   ├── ProfileDisplay/
│   │   ├── ProfileDisplay.js (No changes needed)
│   │   └── ProfileDisplay.css (No changes needed)
│   └── tests/
│       └── ChatHeader/
│           └── UserMenu.test.js (Updated test)
```

## Testing Checklist
- [x] "View Profile" button appears in user menu
- [x] "Edit Profile" button is removed from user menu
- [x] Clicking "View Profile" opens ProfileDisplay modal
- [x] Profile picture can be updated by clicking avatar
- [x] Bio can be edited inline with ✏️ button
- [x] Display name can be edited inline with ✏️ button
- [x] Changes save correctly
- [x] Cancel buttons work for each field
- [x] Unit tests pass

## Notes
- The ProfileDisplay component was already built with inline editing capabilities
- No backend changes required
- All existing profile editing functionality is preserved
- The change is purely a UX simplification
