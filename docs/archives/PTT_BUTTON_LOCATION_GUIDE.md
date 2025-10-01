# Voice Chat PTT Button - Quick Reference Guide

## Where to Find the PTT Toggle Button

### ✅ Location: Voice Controls Section

The **Push-to-Talk (PTT)** toggle button appears in the voice controls section, **ONLY when you are connected to voice chat**.

---

## Step-by-Step Instructions

### 1. Join Voice Chat First

You must **join the voice chat** before the PTT button becomes visible.

**Button to click:** 
```
┌─────────────────────┐
│  📞 Join Voice      │
└─────────────────────┘
```

### 2. After Joining, Look for 3 Buttons

Once connected, you'll see **three buttons** in the voice controls:

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  🎤 Mute     │  │ 🎙️ PTT: OFF │  │  📞 Leave   │
└──────────────┘  └──────────────┘  └──────────────┘
```

### 3. Click the PTT Button

The **middle button** is the PTT toggle:
- **🎙️ PTT: OFF** = Always-on mode (default)
- **🎙️ PTT: ON** = Push-to-talk mode (green glow)

---

## Visual Layout After Joining

```
┌─────────────────────────────────────────────┐
│  🎙️ Voice Chat                              │
│  3 people                                    │
├─────────────────────────────────────────────┤
│                                              │
│  [List of Participants]                     │
│  • User 1 (Character 1)                     │
│  • User 2 (Character 2)                     │
│  • User 3 (Character 3)                     │
│                                              │
├─────────────────────────────────────────────┤
│                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ 🎤 Mute  │ │🎙️ PTT:OFF│ │📞 Leave │   │
│  └──────────┘ └──────────┘ └──────────┘   │
│                                              │
└─────────────────────────────────────────────┘
```

---

## PTT Mode Active

When you **enable PTT mode** (click the PTT button):

```
┌─────────────────────────────────────────────┐
│  🎙️ Voice Chat                              │
│  3 people                                    │
├─────────────────────────────────────────────┤
│                                              │
│  [List of Participants]                     │
│                                              │
├─────────────────────────────────────────────┤
│                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │🎤 Mute   │ │🎙️ PTT: ON│ │📞 Leave │   │
│  │(disabled)│ │  (green)  │ │         │   │
│  └──────────┘ └──────────┘ └──────────┘   │
│                                              │
│  ┌─────────────────────────────────────┐   │
│  │ 🎤 Push to Talk                     │   │
│  │    Hold to Talk            [SPACE]  │   │
│  └─────────────────────────────────────┘   │
│                                              │
└─────────────────────────────────────────────┘
```

### What Changes When PTT is ON:
1. **Mute button** becomes **disabled** (grayed out)
2. **PTT button** shows **green glow** and says **"PTT: ON"**
3. **PTT Indicator** appears below showing **"Hold to Talk"**
4. Your **microphone is muted** until you hold SPACEBAR

---

## Using PTT Mode

### Hold SPACEBAR to Talk

When PTT is enabled:
1. **Hold down SPACEBAR** → Microphone unmutes
2. **Speak while holding** → Your voice is transmitted
3. **Release SPACEBAR** → Microphone mutes again

### Visual Feedback

When you **hold SPACEBAR**:

```
┌─────────────────────────────────────┐
│ 🎤 Push to Talk                     │
│    Transmitting             [SPACE] │  ← Pulsing green glow
└─────────────────────────────────────┘
```

---

## Why You Might Not See the PTT Button

### ❌ Problem: No PTT Button Visible

**Reason #1: Not Connected to Voice Chat**
- The PTT button **only appears after you join** voice chat
- **Solution:** Click "📞 Join Voice" first

**Reason #2: Viewing Before Joining**
- When not connected, you only see the "Join Voice" button
- **Solution:** Join first, then the controls appear

**Reason #3: Panel Too Small**
- On very small screens, buttons might wrap
- **Solution:** Scroll down or expand your browser window

**Reason #4: Minimized View (Floating Panel)**
- In the floating panel's minimized state, only basic controls show
- **Solution:** Click the expand button (⛶) to see full controls

---

## Where PTT Mode Works

### ✅ Campaign Dashboard - Voice Tab
1. Click **"Voice"** in the left sidebar
2. Click **"📞 Join Voice"**
3. Look for **"🎙️ PTT: OFF"** button

### ✅ Campaign Chat Room - Floating Panel
1. Open any chat channel
2. Floating voice panel appears on the right
3. Click **"📞 Join Voice"**
4. Look for **"🎙️ PTT: OFF"** button

### 🔄 Setting Persists Across Both Views
- Toggle PTT in Dashboard → It's enabled in Chat Room
- Toggle PTT in Chat Room → It's enabled in Dashboard
- Setting saved to browser localStorage

---

## Recent Changes (Sept 30, 2025)

### ✅ Dashboard Voice Tab Now Full Size
- Voice chat panel now takes **100% width and height** of the dashboard content area
- Better visibility of all controls
- More space for participant list
- Controls positioned at bottom of panel

### ✅ Button Layout Improvements
- Buttons now **wrap on smaller screens**
- Minimum width of 120px for each button
- Better spacing and padding
- More visible on mobile devices

---

## Troubleshooting

### "I still don't see the PTT button!"

**Checklist:**
- [ ] Have you **joined voice chat**? (Click "Join Voice" first)
- [ ] Are you looking at the **full panel** (not minimized)?
- [ ] Try **refreshing the page** and joining again
- [ ] Check browser console for errors (F12)
- [ ] Try a different browser (Chrome/Firefox recommended)

### "PTT button is grayed out"

**This is expected!** The PTT button is never grayed out. You might be looking at:
- **Mute button** - This becomes grayed when PTT is ON (expected behavior)
- **Join Voice button** - This is grayed while connecting

### "PTT doesn't work when I press spacebar"

**Check:**
- [ ] Is PTT mode **enabled**? (Button should say "PTT: ON" with green glow)
- [ ] Are you **in a text field**? (PTT is disabled while typing in chat)
- [ ] Is voice chat **connected**? (Check connection status)
- [ ] Try clicking the PTT button again to toggle it

---

## Quick Reference

| State | Mute Button | PTT Button | Microphone | Spacebar |
|-------|-------------|------------|------------|----------|
| **Not Connected** | Hidden | Hidden | Off | N/A |
| **Always-On Mode** | Enabled | "PTT: OFF" | On | Ignored |
| **PTT Mode (idle)** | Disabled | "PTT: ON" (green) | Muted | Press to talk |
| **PTT Mode (active)** | Disabled | "PTT: ON" (green) | Unmuted | Held down |

---

## Need Help?

If you still can't find or use the PTT button:
1. Make sure you're on the latest version
2. Clear browser cache and reload
3. Check browser console (F12) for errors
4. Try a different browser
5. Report the issue with:
   - Browser name and version
   - Screenshot of the voice panel
   - Console error messages (if any)

---

**Last Updated:** September 30, 2025  
**Feature:** Push-to-Talk Mode (Phase 3.3)
