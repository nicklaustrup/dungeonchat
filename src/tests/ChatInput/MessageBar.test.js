import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageBar } from '../../components/ChatInput/MessageBar';

describe('MessageBar', () => {
  test('calls onChange', () => {
    const onChange = jest.fn();
    const taRef = React.createRef();
    render(<MessageBar text="" onChange={onChange} onKeyDown={() => {}} textareaRef={taRef} />);
    const textarea = screen.getByLabelText(/message text/i);
    fireEvent.change(textarea, { target: { value: 'hi' } });
    expect(onChange).toHaveBeenCalledWith('hi');
  });
});
