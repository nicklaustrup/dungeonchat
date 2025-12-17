import { renderHook, act } from "@testing-library/react";
import { useTypingPresence } from "../../hooks/useTypingPresence";

jest.mock("../../services/presenceService", () => ({
  setTyping: jest.fn(),
  refreshPresence: jest.fn(),
}));

jest.mock("../../utils/sound", () => ({
  playTypingSound: jest.fn(),
  playTapSound: jest.fn(),
  playSendMessageSound: jest.fn(),
  playReceiveMessageSound: jest.fn(),
  beginTypingLoop: jest.fn(),
  endTypingLoop: jest.fn(),
}));

import { setTyping, refreshPresence } from "../../services/presenceService";

describe("useTypingPresence", () => {
  const base = {
    rtdb: {},
    user: { uid: "u1", displayName: "Alice" },
    soundEnabled: true,
  };
  test("handleInputActivity triggers presence & typing state", () => {
    const { result } = renderHook(() => useTypingPresence(base));
    act(() => {
      result.current.handleInputActivity(1);
    });
    expect(setTyping).toHaveBeenCalledWith(base.rtdb, {
      uid: "u1",
      displayName: "Alice",
      typing: true,
    });
    expect(refreshPresence).toHaveBeenCalledWith(base.rtdb, { uid: "u1" });
  });

  test("stops typing after inactivity", () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useTypingPresence(base));
    act(() => {
      result.current.handleInputActivity(2);
    });
    expect(setTyping).toHaveBeenCalledWith(base.rtdb, {
      uid: "u1",
      displayName: "Alice",
      typing: true,
    });
    act(() => {
      jest.advanceTimersByTime(6000);
    });
    expect(setTyping).toHaveBeenCalledWith(base.rtdb, {
      uid: "u1",
      displayName: "Alice",
      typing: false,
    });
    jest.useRealTimers();
  });

  test("no calls without user", () => {
    const { result } = renderHook(() =>
      useTypingPresence({ ...base, user: null })
    );
    act(() => {
      result.current.handleInputActivity(5);
    });
    expect(setTyping).not.toHaveBeenCalled();
  });
});
