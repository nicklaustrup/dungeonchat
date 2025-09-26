import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReplyPreview } from '../../components/ChatInput/ReplyPreview';

describe('ReplyPreview', () => {
  test('renders and triggers jump + cancel', () => {
    const onCancel = jest.fn();
    const onJump = jest.fn();
    const replyingTo = { id: 'abc', displayName: 'Alice' };
    render(<ReplyPreview replyingTo={replyingTo} onCancel={onCancel} onJump={onJump} />);
    fireEvent.click(screen.getByRole('button', { name: /jump to original/i }));
    expect(onJump).toHaveBeenCalledWith('abc');
    fireEvent.click(screen.getByRole('button', { name: /cancel reply/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  test('returns null when no replyingTo', () => {
    const { container } = render(<ReplyPreview replyingTo={null} />);
    expect(container.firstChild).toBeNull();
  });
});
