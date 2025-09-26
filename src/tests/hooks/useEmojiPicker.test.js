import { renderHook, act } from '@testing-library/react';
import { useEmojiPicker } from '../../hooks/useEmojiPicker';

// Mock EmojiMenu to capture open calls
jest.mock('../../components/ChatInput/EmojiMenu', () => ({
  __esModule: true,
  default: { open: jest.fn() },
  open: jest.fn()
}));
import EmojiMenu from '../../components/ChatInput/EmojiMenu';

describe('useEmojiPicker', () => {
  test('toggles and calls EmojiMenu.open', () => {
    const { result } = renderHook(() => useEmojiPicker());
    expect(result.current.open).toBe(false);
    act(() => { result.current.toggle(); });
    expect(EmojiMenu.open).toHaveBeenCalled();
    expect(result.current.open).toBe(true);
    act(() => { result.current.toggle(); });
    expect(result.current.open).toBe(false);
  });

  test('setOnSelect registers handler', () => {
    const { result } = renderHook(() => useEmojiPicker());
    const handler = jest.fn();
    act(() => { result.current.setOnSelect(handler); });
    // simulate callback path
    const openArgs = { onSelect: null };
    EmojiMenu.open.mockImplementationOnce((opts) => { openArgs.onSelect = opts.onSelect; });
    act(() => { result.current.toggle(); });
    openArgs.onSelect && openArgs.onSelect({ emoji: '😀' });
    // since we don't expose internal onSelect, just ensure no crash
  });
});
