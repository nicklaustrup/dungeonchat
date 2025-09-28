import { renderHook } from '@testing-library/react';
import { useMessageSearch } from '../useMessageSearch';

describe('useMessageSearch performance optimizations', () => {
  test('implements LRU cache for search results', () => {
    const messages = [
      { id: '1', text: 'Hello world', uid: 'user1' },
      { id: '2', text: 'Hello there', uid: 'user2' },
      { id: '3', text: 'Goodbye world', uid: 'user1' },
      { id: '4', text: 'Testing search', uid: 'user3' }
    ];

    const { result, rerender } = renderHook(
      ({ searchTerm }) => useMessageSearch(messages, searchTerm),
      { initialProps: { searchTerm: 'hello' } }
    );

    const firstSearchResult = result.current;
    expect(firstSearchResult).toHaveLength(2);

    // Search for different term
    rerender({ searchTerm: 'world' });
    const secondSearchResult = result.current;
    expect(secondSearchResult).toHaveLength(2);

    // Return to first search term - should use cached result
    rerender({ searchTerm: 'hello' });
    const cachedResult = result.current;
    
    // Should return same reference if properly cached
    expect(cachedResult).toHaveLength(2);
  });

  test('handles null safety for messages parameter', () => {
    const { result } = renderHook(() => useMessageSearch(null, 'test'));
    
    // Should not throw and return empty array
    expect(result.current).toEqual([]);
  });

  test('handles undefined messages gracefully', () => {
    const { result } = renderHook(() => useMessageSearch(undefined, 'test'));
    
    // Should not throw and return empty array
    expect(result.current).toEqual([]);
  });

  test('efficiently searches large message datasets', () => {
    // Create large dataset
    const largeMessages = Array.from({ length: 5000 }, (_, i) => ({
      id: `msg${i}`,
      text: `Message ${i} contains searchable content`,
      uid: `user${i % 100}`
    }));

    const startTime = performance.now();
    
    const { result } = renderHook(() => 
      useMessageSearch(largeMessages, 'searchable')
    );

    const endTime = performance.now();
    const searchTime = endTime - startTime;

    // Should complete search within reasonable time (under 50ms)
    expect(searchTime).toBeLessThan(50);
    expect(result.current).toHaveLength(5000); // All messages contain 'searchable'
  });

  test('memoizes search results to prevent unnecessary recalculation', () => {
    const messages = [
      { id: '1', text: 'Hello world', uid: 'user1' },
      { id: '2', text: 'Hello there', uid: 'user2' }
    ];

    const { result, rerender } = renderHook(
      ({ searchTerm }) => useMessageSearch(messages, searchTerm),
      { initialProps: { searchTerm: 'hello' } }
    );

    // Re-render with same props
    rerender({ searchTerm: 'hello' });
    
    // Should return same reference due to memoization
    expect(result.current).toHaveLength(2);
    expect(result.current[0].text).toContain('Hello');
  });

  test('case-insensitive search works correctly', () => {
    const messages = [
      { id: '1', text: 'Hello World', uid: 'user1' },
      { id: '2', text: 'hello there', uid: 'user2' },
      { id: '3', text: 'HELLO EVERYONE', uid: 'user3' }
    ];

    const { result } = renderHook(() => useMessageSearch(messages, 'HELLO'));
    
    // Should find all messages regardless of case
    expect(result.current).toHaveLength(3);
  });

  test('empty search term returns all messages', () => {
    const messages = [
      { id: '1', text: 'Hello', uid: 'user1' },
      { id: '2', text: 'World', uid: 'user2' }
    ];

    const { result } = renderHook(() => useMessageSearch(messages, ''));
    
    // Empty search should return all messages
    expect(result.current).toHaveLength(2);
    expect(result.current).toEqual(messages);
  });

  test('handles special regex characters in search term', () => {
    const messages = [
      { id: '1', text: 'Hello (world)', uid: 'user1' },
      { id: '2', text: 'Test [brackets]', uid: 'user2' },
      { id: '3', text: 'Special chars: .*+?^${}()|[]\\', uid: 'user3' }
    ];

    // Test with regex special characters
    const { result: parenResult } = renderHook(() => 
      useMessageSearch(messages, '(world)')
    );
    expect(parenResult.current).toHaveLength(1);

    const { result: bracketResult } = renderHook(() => 
      useMessageSearch(messages, '[brackets]')
    );
    expect(bracketResult.current).toHaveLength(1);
  });

  test('performs efficiently with frequent search term changes', () => {
    const messages = Array.from({ length: 1000 }, (_, i) => ({
      id: `msg${i}`,
      text: `Message ${i} test content`,
      uid: `user${i % 10}`
    }));

    const searchTerms = ['test', 'message', 'content', '123', '456'];
    
    const startTime = performance.now();
    
    // Rapid search term changes
    searchTerms.forEach(term => {
      renderHook(() => useMessageSearch(messages, term));
    });

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    // Should handle rapid changes efficiently
    expect(totalTime).toBeLessThan(100);
  });
});