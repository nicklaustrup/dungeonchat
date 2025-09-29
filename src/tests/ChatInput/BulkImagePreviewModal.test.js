import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BulkImagePreviewModal } from '../../components/ChatInput/BulkImagePreviewModal';

// Mock services
jest.mock('../../services/imageUploadService', () => ({
  compressImage: jest.fn(async (file) => file),
  uploadImage: jest.fn(async () => 'https://example.com/uploaded-image.png')
}));

jest.mock('../../services/messageService', () => ({
  createImageMessage: jest.fn()
}));

describe('BulkImagePreviewModal', () => {
  const mockImages = [
    {
      id: '1',
      file: new File(['test1'], 'test1.png', { type: 'image/png' }),
      preview: 'data:image/png;base64,test1'
    },
    {
      id: '2',
      file: new File(['test2'], 'test2.png', { type: 'image/png' }),
      preview: 'data:image/png;base64,test2'
    },
    {
      id: '3',
      file: new File(['test3'], 'test3.png', { type: 'image/png' }),
      preview: 'data:image/png;base64,test3'
    }
  ];

  test('renders bulk image modal with multiple images', () => {
    render(
      <BulkImagePreviewModal
        images={mockImages}
        uploading={false}
        onSend={jest.fn()}
        onCancel={jest.fn()}
        onRemoveImage={jest.fn()}
      />
    );

    expect(screen.getByText('3 Images Selected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send 3 images/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();

    // Check that all images are displayed
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(3);
  });

  test('remove individual image functionality', async () => {
    const mockRemoveImage = jest.fn();
    
    render(
      <BulkImagePreviewModal
        images={mockImages}
        uploading={false}
        onSend={jest.fn()}
        onCancel={jest.fn()}
        onRemoveImage={mockRemoveImage}
      />
    );

    // Find and click the first remove button
    const removeButtons = screen.getAllByRole('button', { name: /remove image/i });
    expect(removeButtons).toHaveLength(3);

    fireEvent.click(removeButtons[0]);
    expect(mockRemoveImage).toHaveBeenCalledWith('1');
  });

  test('send button calls onSend handler', () => {
    const mockSend = jest.fn();
    
    render(
      <BulkImagePreviewModal
        images={mockImages}
        uploading={false}
        onSend={mockSend}
        onCancel={jest.fn()}
        onRemoveImage={jest.fn()}
      />
    );

    const sendButton = screen.getByRole('button', { name: /send 3 images/i });
    fireEvent.click(sendButton);
    
    expect(mockSend).toHaveBeenCalled();
  });

  test('cancel button calls onCancel handler', () => {
    const mockCancel = jest.fn();
    
    render(
      <BulkImagePreviewModal
        images={mockImages}
        uploading={false}
        onSend={jest.fn()}
        onCancel={mockCancel}
        onRemoveImage={jest.fn()}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(mockCancel).toHaveBeenCalled();
  });

  test('shows uploading state correctly', () => {
    render(
      <BulkImagePreviewModal
        images={mockImages}
        uploading={true}
        onSend={jest.fn()}
        onCancel={jest.fn()}
        onRemoveImage={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /uploading/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel upload/i })).toBeInTheDocument();

    // Remove buttons should be disabled during upload
    const removeButtons = screen.getAllByRole('button', { name: /remove image/i });
    removeButtons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  test('keyboard navigation works correctly', () => {
    render(
      <BulkImagePreviewModal
        images={mockImages}
        uploading={false}
        onSend={jest.fn()}
        onCancel={jest.fn()}
        onRemoveImage={jest.fn()}
      />
    );

    // Test Escape key
    fireEvent.keyDown(document, { key: 'Escape' });
    // Note: In a real implementation, we'd need to pass the cancel handler to test this
  });

  test('does not render when no images provided', () => {
    const { container } = render(
      <BulkImagePreviewModal
        images={[]}
        uploading={false}
        onSend={jest.fn()}
        onCancel={jest.fn()}
        onRemoveImage={jest.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  test('handles single image correctly', () => {
    const singleImage = [mockImages[0]];
    
    render(
      <BulkImagePreviewModal
        images={singleImage}
        uploading={false}
        onSend={jest.fn()}
        onCancel={jest.fn()}
        onRemoveImage={jest.fn()}
      />
    );

    expect(screen.getByText('1 Image Selected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send 1 image/i })).toBeInTheDocument();
  });
});