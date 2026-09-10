import { render, screen } from '@testing-library/react-native';

import SettingsScreen from '@/app/(tabs)/settings';

/**
 * Confirms the Jest/RNTL/expo-router setup can render a real app screen end-to-end.
 * Uses Settings rather than Library: Library (since Task 32) reads from the live
 * database via useLiveQuery, which has no Jest mock (Task 14) and crashes under Jest;
 * Settings renders statically with no DB access until its dev-only seed button is
 * actually pressed, so it stays a safe, real-screen smoke target regardless of what
 * either screen's own implementation does next.
 */
describe('smoke test', () => {
  it('renders the Settings screen', async () => {
    await render(<SettingsScreen />);
    expect(screen.getByText('Settings')).toBeOnTheScreen();
  });
});
