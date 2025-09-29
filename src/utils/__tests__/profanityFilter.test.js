import { 
  containsProfanity, 
  filterProfanity, 
  useProfanityFilter, 
  useProfanityFiltering 
} from '../profanityFilter';
import { renderHook } from '@testing-library/react';

describe('profanityFilter', () => {
  describe('containsProfanity', () => {
    test('detects profanity in text', () => {
      expect(containsProfanity('This is fucking awesome')).toBe(true);
      expect(containsProfanity('Holy shit that was great')).toBe(true);
      expect(containsProfanity('What the hell is going on')).toBe(true);
    });

    test('returns false for clean text', () => {
      expect(containsProfanity('This is a nice message')).toBe(false);
      expect(containsProfanity('Hello world')).toBe(false);
      expect(containsProfanity('')).toBe(false);
      expect(containsProfanity(null)).toBe(false);
    });

    test('avoids false positives with word boundaries', () => {
      expect(containsProfanity('classic')).toBe(false); // contains 'ass' but not as whole word
      expect(containsProfanity('assistance')).toBe(false); // contains 'ass' but not as whole word
      expect(containsProfanity('class')).toBe(false); // contains 'ass' but not as whole word
    });
  });

  describe('filterProfanity', () => {
    test('filters profanity with first letter + asterisks', () => {
      expect(filterProfanity('This is fucking awesome')).toBe('This is f****** awesome');
      expect(filterProfanity('Holy shit that was great')).toBe('Holy s*** that was great');
      expect(filterProfanity('What the hell is going on')).toBe('What the h*** is going on');
    });

    test('handles multiple profane words', () => {
      expect(filterProfanity('This shit is fucking terrible')).toBe('This s*** is f****** terrible');
    });

    test('preserves clean text unchanged', () => {
      expect(filterProfanity('This is a nice message')).toBe('This is a nice message');
      expect(filterProfanity('Hello world')).toBe('Hello world');
    });

    test('handles edge cases', () => {
      expect(filterProfanity('')).toBe('');
      expect(filterProfanity(null)).toBe(null);
      expect(filterProfanity(undefined)).toBe(undefined);
    });

    test('preserves case in filtered words', () => {
      expect(filterProfanity('This is FUCKING awesome')).toBe('This is F****** awesome');
      expect(filterProfanity('Holy SHIT that was great')).toBe('Holy S*** that was great');
    });
  });

  describe('useProfanityFilter', () => {
    test('filters text when filter is enabled', () => {
      expect(useProfanityFilter('This is fucking awesome', true)).toBe('This is f****** awesome');
    });

    test('returns original text when filter is disabled', () => {
      expect(useProfanityFilter('This is fucking awesome', false)).toBe('This is fucking awesome');
    });
  });

  describe('useProfanityFiltering hook', () => {
    test('returns filter functions with enabled state', () => {
      const { result } = renderHook(() => useProfanityFiltering(true));
      
      expect(result.current.isFilterEnabled).toBe(true);
      expect(result.current.filterText('This is fucking awesome')).toBe('This is f****** awesome');
      expect(result.current.containsProfanity('This is fucking awesome')).toBe(true);
    });

    test('returns filter functions with disabled state', () => {
      const { result } = renderHook(() => useProfanityFiltering(false));
      
      expect(result.current.isFilterEnabled).toBe(false);
      expect(result.current.filterText('This is fucking awesome')).toBe('This is fucking awesome');
      expect(result.current.containsProfanity('This is fucking awesome')).toBe(true);
    });

    test('defaults to enabled when no parameter provided', () => {
      const { result } = renderHook(() => useProfanityFiltering());
      
      expect(result.current.isFilterEnabled).toBe(true);
    });
  });
});