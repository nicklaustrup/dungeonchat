import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageBar } from '../../components/ChatInput/MessageBar';

describe('MessageBar', () => {
  test('calls onChange and onPickEmoji', () => {
    const onChange = jest.fn();
    const onPickEmoji = jest.fn();
  const emojiRef = React.createRef();
  const taRef = React.createRef();
  render(<MessageBar text="" onChange={onChange} onKeyDown={() => {}} onPickEmoji={onPickEmoji} onTriggerFile={() => {}} emojiOpen={false} emojiButtonRef={emojiRef} textareaRef={taRef} />);
    const textarea = screen.getByLabelText(/message text/i);
    fireEvent.change(textarea, { target: { value: 'hi' } });
    expect(onChange).toHaveBeenCalledWith('hi');
    const emojiBtn = screen.getByLabelText(/add emoji/i);
    fireEvent.click(emojiBtn);
    expect(onPickEmoji).toHaveBeenCalled();
  });
});
