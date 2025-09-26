import { renderHook, act } from '@testing-library/react';
import { usePerformanceMode } from '../usePerformanceMode';

describe('usePerformanceMode', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('enable-content-visibility');
    localStorage.clear();
  });

  it('defaults to disabled and does not set root class', () => {
    const { result } = renderHook(() => usePerformanceMode());
    expect(result.current.enabled).toBe(false);
    expect(document.documentElement.classList.contains('enable-content-visibility')).toBe(false);
  });

  it('toggles and applies root class & persistence', () => {
    const { result } = renderHook(() => usePerformanceMode());
    act(() => { result.current.toggle(); });
    expect(result.current.enabled).toBe(true);
    expect(document.documentElement.classList.contains('enable-content-visibility')).toBe(true);
    expect(localStorage.getItem('perfModeEnabled')).toBe('1');
  });

  it('loads persisted value', () => {
    localStorage.setItem('perfModeEnabled', '1');
    const { result } = renderHook(() => usePerformanceMode());
    expect(result.current.enabled).toBe(true);
    expect(document.documentElement.classList.contains('enable-content-visibility')).toBe(true);
  });
});
