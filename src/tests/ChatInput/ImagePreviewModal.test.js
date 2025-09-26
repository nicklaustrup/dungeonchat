import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImagePreviewModal } from '../../components/ChatInput/ImagePreviewModal';

describe('ImagePreviewModal', () => {
  test('renders and triggers send/cancel', () => {
    const onSend = jest.fn();
    const onCancel = jest.fn();
    render(<ImagePreviewModal imagePreview="data:image/png;base64,abc" uploading={false} onSend={onSend} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /send image/i }));
    expect(onSend).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  test('returns null when no preview', () => {
    const { container } = render(<ImagePreviewModal imagePreview={null} uploading={false} onSend={() => {}} onCancel={() => {}} />);
    expect(container.firstChild).toBeNull();
  });
});
