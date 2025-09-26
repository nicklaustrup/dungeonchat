import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import InlineReplyContext from '../components/ChatRoom/parts/InlineReplyContext';

jest.mock('../utils/avatar', () => ({ getFallbackAvatar: () => 'data:image/png;base64,fallback24' }));

describe('InlineReplyContext component', () => {
  const base = {
    id: 'm123',
    uid: 'u2',
    displayName: 'Reply User',
    text: 'Original message'
  };

  test('renders snippet and name', () => {
    render(<InlineReplyContext replyTo={base} />);
    expect(screen.getByText('Reply User')).toBeInTheDocument();
    expect(screen.getByText('Original message')).toBeInTheDocument();
  });

  test('calls onNavigate when snippet clicked', () => {
    const onNavigate = jest.fn();
    render(<InlineReplyContext replyTo={base} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByTestId('irc-snippet'));
    expect(onNavigate).toHaveBeenCalledWith('m123');
  });

  test('calls onViewProfile when avatar clicked', () => {
    const onViewProfile = jest.fn();
    render(<InlineReplyContext replyTo={base} onViewProfile={onViewProfile} />);
    fireEvent.click(screen.getByTestId('irc-avatar'));
    expect(onViewProfile).toHaveBeenCalledTimes(1);
  });

  test('shows Image label when type=image and no text', () => {
    const imgReply = { id: 'i1', uid: 'u2', displayName: 'Reply User', type: 'image', text: '' };
    render(<InlineReplyContext replyTo={imgReply} />);
    expect(screen.getByText('Image')).toBeInTheDocument();
  });
});
