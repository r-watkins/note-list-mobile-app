import { fireEvent, render, screen } from '@testing-library/react-native';

import { LibraryResultRow } from '@/components/library/library-result-row';
import type { LibraryEntryWithLabels } from '@/features/library/library.repository';

function makeEntry(overrides: Partial<LibraryEntryWithLabels> = {}): LibraryEntryWithLabels {
  const now = new Date();
  return {
    id: 'entry-1',
    entryType: 'list',
    title: 'Grocery List',
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
    labels: [],
    ...overrides,
  };
}

describe('LibraryResultRow contextual match preview', () => {
  it('renders a nested list-item search hit\'s match preview (e.g. "Dairy · Milk")', async () => {
    await render(<LibraryResultRow entry={makeEntry()} matchPreview="Dairy · Milk" />);
    expect(screen.getByText('Dairy · Milk')).toBeOnTheScreen();
  });

  it('renders no match preview line when none is given', async () => {
    await render(<LibraryResultRow entry={makeEntry()} />);
    expect(screen.queryByText('Dairy · Milk')).toBeNull();
  });
});

describe('LibraryResultRow interaction and accessibility', () => {
  it('fires onPress for a pressable (list) row and labels it by type and title', async () => {
    const onPress = jest.fn();
    await render(<LibraryResultRow entry={makeEntry({ title: 'Camping' })} onPress={onPress} />);
    const row = screen.getByLabelText('List: Camping');
    fireEvent.press(row);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders a note row with no pressable/button role when onPress is omitted', async () => {
    await render(
      <LibraryResultRow entry={makeEntry({ entryType: 'note', title: 'Turkey Pasta' })} />,
    );
    expect(screen.queryByLabelText('Note: Turkey Pasta')).toBeNull();
    expect(screen.getByText('Turkey Pasta')).toBeOnTheScreen();
  });

  it('renders a note\'s labels, capped with a "+N" overflow indicator', async () => {
    const labels = ['Dinner', 'Pasta', 'High Protein', 'Meal Prep'].map((name, index) => ({
      id: `label-${index}`,
      name,
      normalizedName: name.toLowerCase(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    await render(
      <LibraryResultRow entry={makeEntry({ entryType: 'note', title: 'Turkey Pasta', labels })} />,
    );
    expect(screen.getByText('Dinner')).toBeOnTheScreen();
    expect(screen.getByText('Pasta')).toBeOnTheScreen();
    expect(screen.getByText('High Protein')).toBeOnTheScreen();
    expect(screen.queryByText('Meal Prep')).toBeNull();
    expect(screen.getByText('+1')).toBeOnTheScreen();
  });
});
