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
    const onOpenSettings = jest.fn();
    const openSettings = jest.fn();
    render(<UserMenu user={user} onViewProfile={onViewProfile} onOpenSettings={onOpenSettings} openSettings={openSettings} />);
    const chip = screen.getByRole('button', { name: /test user/i });
    fireEvent.click(chip);
    const profileBtn = screen.getByRole('button', { name: /edit profile/i });
    fireEvent.click(profileBtn);
    expect(onViewProfile).toHaveBeenCalled();

    fireEvent.click(chip); // reopen
    const settingsBtn = screen.getByRole('button', { name: /settings/i });
    fireEvent.click(settingsBtn);
    expect(openSettings).toHaveBeenCalled();
    expect(onOpenSettings).toHaveBeenCalled();
  });
});
