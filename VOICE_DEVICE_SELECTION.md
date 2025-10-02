# Voice Chat Device Selection Feature

## Overview
Added the ability to select input (microphone) and output (speaker/headphone) devices in the voice chat settings panel.

## Changes Made

### Files Modified:

1. **`src/components/Voice/VoiceSettings.js`**
   - Added device enumeration on settings panel open
   - Added state for available audio input/output devices
   - Added device selection dropdowns with icons
   - Added loading state while enumerating devices

2. **`src/components/Voice/VoiceSettings.css`**
   - Added styling for device loading indicator
   - Added disabled state styling for device dropdowns

3. **`src/components/Voice/VoiceChatPanel.js`**
   - Added `audioInputDeviceId` and `audioOutputDeviceId` to voice settings state
   - Initialized with 'default' values

## Features Implemented

### 1. **Microphone Selection**
- 🎤 Dropdown list of all available microphones
- Shows device labels (e.g., "Built-in Microphone", "USB Microphone")
- Falls back to device ID if label is not available
- Default option: "Default Microphone" (system default)

### 2. **Speaker Selection**
- 🔊 Dropdown list of all available speakers/headphones
- Shows device labels (e.g., "Built-in Speakers", "Bluetooth Headphones")
- Falls back to device ID if label is not available
- Default option: "Default Speakers" (system default)

### 3. **Device Enumeration**
- Automatically requests microphone permission on settings open
- Lists all available audio input devices (audioinput)
- Lists all available audio output devices (audiooutput)
- Shows "Loading..." state while enumerating

### 4. **User Experience**
- Device dropdowns appear at the top of settings (most important)
- Icons indicate device type (microphone vs speakers)
- Descriptive labels explain each option
- Disabled state while loading devices
- Settings persist when saved

## Technical Implementation

### Device Enumeration Flow:

```javascript
1. User opens voice settings panel
2. useEffect triggers on isOpen change
3. Request getUserMedia({ audio: true }) for permissions
4. Call navigator.mediaDevices.enumerateDevices()
5. Filter devices by kind:
   - audioinput → microphones
   - audiooutput → speakers
6. Populate dropdown options
7. Remove loading state
```

### State Management:

```javascript
const [localSettings, setLocalSettings] = useState({
  audioInputDeviceId: 'default',
  audioOutputDeviceId: 'default',
  audioQuality: 'medium',
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true
});
```

### Device Selection UI:

```jsx
<select
  value={localSettings.audioInputDeviceId || 'default'}
  onChange={(e) => handleChange('audioInputDeviceId', e.target.value)}
  disabled={devicesLoading}
>
  <option value="default">Default Microphone</option>
  {audioInputDevices.map((device) => (
    <option key={device.deviceId} value={device.deviceId}>
      {device.label || `Microphone ${device.deviceId.substring(0, 8)}`}
    </option>
  ))}
</select>
```

## Browser Compatibility

### Supported:
- ✅ Chrome/Edge (full support including output device selection)
- ✅ Firefox (input devices, limited output device support)
- ✅ Safari (input devices, no output device selection API)

### Notes:
- **Output device selection** requires `HTMLMediaElement.setSinkId()` API
- Safari doesn't support output device selection (will show dropdown but may not apply)
- Some browsers require HTTPS for device enumeration
- Device labels require microphone permission

## Security & Privacy

### Permissions Required:
- **Microphone access**: Required to enumerate devices with labels
- Without permission, devices appear as "Microphone [device ID]"

### Privacy Considerations:
- Device enumeration only happens when settings panel opens
- Devices are not persisted to server (local state only)
- User must explicitly save settings to apply changes

## Settings Panel Layout

```
┌─────────────────────────────────┐
│ Voice Settings              [×] │
├─────────────────────────────────┤
│                                 │
│ 🎤 Microphone                   │
│ Select your input device        │
│ [Default Microphone ▼]          │
│                                 │
│ 🔊 Speakers                     │
│ Select your output device       │
│ [Default Speakers ▼]            │
│                                 │
│ Audio Quality                   │
│ Higher quality uses more...     │
│ [Medium (32 kbps) ▼]            │
│                                 │
│ Echo Cancellation               │
│ Reduces echo from speakers      │
│ [Toggle] Enabled                │
│                                 │
│ (... other settings ...)        │
│                                 │
├─────────────────────────────────┤
│              [Cancel] [✓ Save]  │
└─────────────────────────────────┘
```

## Future Integration Points

### Next Steps (Not Implemented Yet):
1. **Apply device selection to WebRTC stream**
   - Pass `audioInputDeviceId` to getUserMedia constraints
   - Use `setSinkId()` on audio elements for output device

2. **Device change detection**
   - Listen to `navigator.mediaDevices.ondevicechange`
   - Update device list when devices are plugged/unplugged

3. **Device testing**
   - Add "Test Microphone" button with audio level meter
   - Add "Test Speakers" button to play test sound

4. **Persistence**
   - Save device preferences to localStorage
   - Restore on next session

### WebRTC Integration Example:

```javascript
// When joining voice chat, use selected device:
const constraints = {
  audio: {
    deviceId: settings.audioInputDeviceId !== 'default' 
      ? { exact: settings.audioInputDeviceId }
      : undefined,
    echoCancellation: settings.echoCancellation,
    noiseSuppression: settings.noiseSuppression,
    autoGainControl: settings.autoGainControl
  }
};

const stream = await navigator.mediaDevices.getUserMedia(constraints);

// For output device (on audio elements):
if (audioElement.setSinkId && settings.audioOutputDeviceId !== 'default') {
  await audioElement.setSinkId(settings.audioOutputDeviceId);
}
```

## Testing Checklist

### Device Enumeration:
- [ ] Open voice settings
- [ ] Verify microphone dropdown populates
- [ ] Verify speaker dropdown populates
- [ ] Check device labels are readable

### Device Selection:
- [ ] Select different microphone
- [ ] Select different speakers
- [ ] Save settings
- [ ] Reopen settings to verify selection persists

### Edge Cases:
- [ ] No microphone connected (should show default only)
- [ ] No permission granted (should show device IDs)
- [ ] Multiple devices of same type
- [ ] Bluetooth device connected/disconnected

### Browser Testing:
- [ ] Chrome (full support)
- [ ] Firefox (input devices)
- [ ] Safari (input devices, output may not work)
- [ ] Edge (full support)

## Known Limitations

1. **Output Device Selection**: Safari doesn't support `setSinkId()`
2. **Device Labels**: Require microphone permission
3. **Not Applied Yet**: Selected devices don't affect actual audio stream (needs WebRTC integration)
4. **No Persistence**: Settings reset when page reloads (needs localStorage)
5. **No Live Testing**: Can't test microphone/speakers before joining call

## Related Files

- `src/hooks/useVoiceChat.js` - WebRTC manager hook (needs update to use deviceId)
- `src/services/voice/webrtcManager.js` - WebRTC implementation (needs device constraint support)
- `src/components/Voice/VoiceChatPanel.js` - Main voice panel component

## Console Logging

Device enumeration logs:
```
[VoiceSettings] Found devices: { inputs: 3, outputs: 2 }
```

## Error Handling

Errors are logged to console:
```javascript
console.error('[VoiceSettings] Error enumerating devices:', error);
```

Common errors:
- Permission denied
- No devices found
- Browser doesn't support device enumeration
