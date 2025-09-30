import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import UserMenu from '../../components/ChatHeader/UserMenu';

jest.mock('../../components/SignOut/SignOut', () => () => <div>SignOutButton</div>);

describe('UserMenu', () => {
  const user = { displayName: 'Test User', email: 'user@example.com', photoURL: '' };

  test('renders user chip and toggles menu', () => {
    render(<UserMenu user={user} openSettings={() => {}} />);
    const chip = screen.getByRole('button', { name: /test user/i });
    fireEvent.click(chip);
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  test('invokes profile and settings callbacks then closes', () => {
    const onViewProfile = jest.fn();
    const onEditProfile = jest.fn();
    const onOpenSettings = jest.fn();
    const openSettings = jest.fn();
    render(<UserMenu user={user} onViewProfile={onViewProfile} onEditProfile={onEditProfile} onOpenSettings={onOpenSettings} openSettings={openSettings} />);
    const chip = screen.getByRole('button', { name: /test user/i });
    fireEvent.click(chip);
    const profileBtn = screen.getByRole('button', { name: /edit profile/i });
    fireEvent.click(profileBtn);
    expect(onEditProfile).toHaveBeenCalled();

    fireEvent.click(chip); // reopen
    const settingsBtn = screen.getByRole('button', { name: /settings/i });
    fireEvent.click(settingsBtn);
    expect(openSettings).toHaveBeenCalled();
    expect(onOpenSettings).toHaveBeenCalled();
  });

  test('applies long-username class for usernames over 30 characters', () => {
    const longUser = { 
      displayName: 'This is a very extraordinarily long display name that exceeds thirty characters', 
      email: 'long@example.com', 
      photoURL: '' 
    };
    render(<UserMenu user={longUser} openSettings={() => {}} />);
    const chipNameSpan = document.querySelector('.user-chip-name');
    expect(chipNameSpan).toHaveClass('long-username');
  });

  test('does not apply long-username class for usernames under 30 characters', () => {
    const shortUser = { 
      displayName: 'Short Name', 
      email: 'short@example.com', 
      photoURL: '' 
    };
    render(<UserMenu user={shortUser} openSettings={() => {}} />);
    const chipNameSpan = document.querySelector('.user-chip-name');
    expect(chipNameSpan).not.toHaveClass('long-username');
  });
});
