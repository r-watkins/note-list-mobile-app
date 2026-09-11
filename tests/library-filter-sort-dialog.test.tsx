import { PortalHost } from '@rn-primitives/portal';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { LibraryFilterSortDialog } from '@/components/library/library-filter-sort-dialog';
import type { LabelRow } from '@/features/labels/label.repository';

const mockLabels: LabelRow[] = [
  {
    id: 'lb1',
    name: 'Breakfast',
    normalizedName: 'breakfast',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'lb2',
    name: 'Dinner',
    normalizedName: 'dinner',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// useLabels reads the live database (useLiveQuery), which has no Jest mock and crashes
// under Jest (Task 14) - mocked here so this dialog can be rendered in isolation without
// touching expo-sqlite at all.
jest.mock('@/features/labels/label.hooks', () => ({
  useLabels: () => mockLabels,
}));

const noop = () => {};

// RNR's Dialog renders its content into a PortalHost (mounted at the app root in
// src/app/_layout.tsx); without one present, the dialog's content mounts nowhere.
function renderDialog(
  overrides: Partial<React.ComponentProps<typeof LibraryFilterSortDialog>> = {},
) {
  return render(
    <>
      <LibraryFilterSortDialog
        open
        onOpenChange={noop}
        contentType="all"
        onContentTypeChange={noop}
        labelId={undefined}
        onLabelIdChange={noop}
        sort="updated-desc"
        onSortChange={noop}
        {...overrides}
      />
      <PortalHost />
    </>,
  );
}

describe('LibraryFilterSortDialog content-type filter', () => {
  it('calls onContentTypeChange when a content-type option is tapped', async () => {
    const onContentTypeChange = jest.fn();
    await renderDialog({ onContentTypeChange });

    fireEvent.press(screen.getByText('Lists'));

    expect(onContentTypeChange).toHaveBeenCalledWith('list');
  });

  it('marks the current content-type option as selected', async () => {
    await renderDialog({ contentType: 'note' });

    expect(screen.getByRole('button', { name: 'Notes' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'All' })).not.toBeSelected();
  });
});

describe('LibraryFilterSortDialog label filter behavior', () => {
  it('lists every label plus "Any", and calls onLabelIdChange when one is tapped', async () => {
    const onLabelIdChange = jest.fn();
    await renderDialog({ onLabelIdChange });

    expect(screen.getByText('Any')).toBeOnTheScreen();
    expect(screen.getByText('Breakfast')).toBeOnTheScreen();
    expect(screen.getByText('Dinner')).toBeOnTheScreen();

    fireEvent.press(screen.getByText('Dinner'));

    expect(onLabelIdChange).toHaveBeenCalledWith('lb2');
  });

  it('clears the label filter when "Any" is tapped', async () => {
    const onLabelIdChange = jest.fn();
    await renderDialog({ labelId: 'lb2', onLabelIdChange });

    fireEvent.press(screen.getByText('Any'));

    expect(onLabelIdChange).toHaveBeenCalledWith(undefined);
  });

  it('disables the All/Lists content-type options while a label filter is active (spec §7.3)', async () => {
    await renderDialog({ labelId: 'lb2', contentType: 'note' });

    expect(screen.getByRole('button', { name: 'All' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Lists' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Notes' })).not.toBeDisabled();
    expect(
      screen.getByText('Only notes can show while a label filter is active.'),
    ).toBeOnTheScreen();
  });

  it('does not disable content-type options or show the explainer when no label filter is active', async () => {
    await renderDialog();

    expect(screen.getByRole('button', { name: 'All' })).not.toBeDisabled();
    expect(screen.queryByText('Only notes can show while a label filter is active.')).toBeNull();
  });
});
