import { render, screen } from '@testing-library/react-native';

import LibraryScreen from '@/app/(tabs)/library';

describe('smoke test', () => {
  it('renders the Library placeholder screen', async () => {
    await render(<LibraryScreen />);
    expect(screen.getByText('Library')).toBeOnTheScreen();
  });
});
