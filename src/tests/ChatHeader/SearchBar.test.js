import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchBar from '../../components/ChatHeader/SearchBar';

describe('SearchBar', () => {
  test('renders with value and calls onChange', () => {
    const handle = jest.fn();
    render(<SearchBar value="hello" onChange={handle} />);
    const input = screen.getByLabelText(/search messages/i);
    expect(input.value).toBe('hello');
    fireEvent.change(input, { target: { value: 'world' } });
    expect(handle).toHaveBeenCalledWith('world');
  });
});
