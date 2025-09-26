import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EditMessageForm from '../../parts/EditMessageForm';
import DeleteConfirmModal from '../../parts/DeleteConfirmModal';
import ImagePreviewModal from '../../parts/ImagePreviewModal';
import MessageOptionsMenu from '../../parts/MessageOptionsMenu';
import MessageHeader from '../../parts/MessageHeader';
import HoverTimestamp from '../../parts/HoverTimestamp';

// Helper: portal root already provided by jsdom (document.body)

describe('Modular parts components', () => {
  test('EditMessageForm triggers onChange and onSave/onCancel', () => {
    const handleChange = jest.fn();
    const handleSave = jest.fn();
    const handleCancel = jest.fn();
    render(<EditMessageForm value="Hello" onChange={handleChange} onSave={handleSave} onCancel={handleCancel} onKeyDown={() => {}} />);
    const ta = screen.getByLabelText(/edit message text/i);
    fireEvent.change(ta, { target: { value: 'Updated' } });
    expect(handleChange).toHaveBeenCalledWith('Updated');
    fireEvent.click(screen.getByRole('button', { name: /save edit/i }));
    expect(handleSave).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /cancel edit/i }));
    expect(handleCancel).toHaveBeenCalled();
  });

  test('DeleteConfirmModal open=false renders nothing', () => {
    const { container } = render(<DeleteConfirmModal open={false} onConfirm={()=>{}} onCancel={()=>{}} />);
    expect(container.firstChild).toBeNull();
  });

  test('DeleteConfirmModal open=true triggers actions', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    render(<DeleteConfirmModal open={true} onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onConfirm).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  test('ImagePreviewModal toggles properly', () => {
    const onClose = jest.fn();
    render(<ImagePreviewModal open={true} src="/img.png" onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /close image preview/i }));
    expect(onClose).toHaveBeenCalled();
  });

  test('MessageOptionsMenu renders quick reactions & actions', () => {
    const addReaction = jest.fn();
    const handleAddReactionFull = jest.fn();
    const handleCopyText = jest.fn();
    const startEditing = jest.fn();
    const onDelete = jest.fn();
    const onReply = jest.fn();
    render(
      <MessageOptionsMenu
        open={true}
        menuPanelRef={{ current: null }}
        menuMode="down"
        menuReady={true}
        menuStyle={{ top: 0, left: 0, position: 'fixed' }}
        quickMenuEmojis={['👍','❤️','😂']}
        addReaction={addReaction}
        handleAddReactionFull={handleAddReactionFull}
        onReply={onReply}
        message={{ id: 'm1' }}
        handleCopyText={handleCopyText}
        canEdit={true}
        startEditing={startEditing}
        canDelete={true}
        onDelete={onDelete}
        text="hello"
      />
    );
    fireEvent.click(screen.getByRole('menuitem', { name: /add reaction/i }));
    expect(handleAddReactionFull).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('menuitem', { name: /copy text/i }));
    expect(handleCopyText).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('menuitem', { name: /edit/i }));
    expect(startEditing).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('menuitem', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('menuitem', { name: /reply/i }));
    expect(onReply).toHaveBeenCalled();
    // quick reaction buttons
    fireEvent.click(screen.getByRole('button', { name: /react with 👍/i }));
    expect(addReaction).toHaveBeenCalledWith('👍');
  });

  test('MessageHeader triggers onViewProfile', () => {
    const onViewProfile = jest.fn();
    const createdAt = { seconds: 0, nanoseconds: 0 };
    const formatTimestamp = () => 'Jan 1, 12:00 AM';
    render(<MessageHeader userName="Nick" createdAt={createdAt} formatTimestamp={formatTimestamp} onViewProfile={onViewProfile} />);
    fireEvent.click(screen.getByRole('button', { name: /view profile for nick/i }));
    expect(onViewProfile).toHaveBeenCalled();
  });

  test('HoverTimestamp shows time portion', () => {
    const createdAt = { seconds: 0, nanoseconds: 0 };
    const formatTimestamp = () => 'Jan 1, 12:34 PM';
    render(<HoverTimestamp createdAt={createdAt} formatTimestamp={formatTimestamp} />);
    expect(screen.getByText('12:34 PM')).toBeInTheDocument();
  });
});
