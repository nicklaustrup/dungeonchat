import { renderHook, act } from '@testing-library/react';
import useMenuToggle from '../../components/ChatHeader/hooks/useMenuToggle';

describe('useMenuToggle', () => {
  test('toggles open state', () => {
    const { result } = renderHook(() => useMenuToggle());
    expect(result.current.open).toBe(false);
    act(() => { result.current.toggle(); });
    expect(result.current.open).toBe(true);
    act(() => { result.current.close(); });
    expect(result.current.open).toBe(false);
  });

  test('closes on Escape key when open', () => {
    const { result } = renderHook(() => useMenuToggle());
    act(() => { result.current.toggle(); });
    expect(result.current.open).toBe(true);
    act(() => {
      const evt = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(evt);
    });
    expect(result.current.open).toBe(false);
  });
});
