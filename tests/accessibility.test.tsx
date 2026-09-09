import { render, screen } from '@testing-library/react-native';

import { ListItemRowView } from '@/components/lists/list-item-row';
import { QuickAddRow } from '@/components/lists/quick-add-row';
import type { ListItemRow } from '@/features/lists/list.repository';

function makeItem(overrides: Partial<ListItemRow> = {}): ListItemRow {
  const now = new Date();
  return {
    id: 'item-1',
    listEntryId: 'entry-1',
    sublistId: null,
    itemType: 'checkbox',
    content: 'Milk',
    isChecked: false,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

const noop = () => {};

describe('ListItemRowView accessibility', () => {
  it("announces an unchecked checkbox item's accessibility state as unchecked", async () => {
    await render(
      <ListItemRowView
        item={makeItem({ isChecked: false })}
        onToggle={noop}
        onEdit={noop}
        onMoveUp={noop}
        onMoveDown={noop}
        isFirst={false}
        isLast={false}
      />,
    );
    expect(screen.getByLabelText('Milk')).not.toBeChecked();
  });

  it("announces a checked checkbox item's accessibility state as checked", async () => {
    await render(
      <ListItemRowView
        item={makeItem({ isChecked: true })}
        onToggle={noop}
        onEdit={noop}
        onMoveUp={noop}
        onMoveDown={noop}
        isFirst={false}
        isLast={false}
      />,
    );
    expect(screen.getByLabelText('Milk')).toBeChecked();
  });

  it('renders no checkbox at all for a text item (checked state is never meaningful for it)', async () => {
    await render(
      <ListItemRowView
        item={makeItem({ itemType: 'text' })}
        onToggle={noop}
        onEdit={noop}
        onMoveUp={noop}
        onMoveDown={noop}
        isFirst={false}
        isLast={false}
      />,
    );
    expect(screen.queryByLabelText('Milk')).toBeNull();
  });

  it('gives every icon-only control (edit, move up, move down) an accessible label', async () => {
    await render(
      <ListItemRowView
        item={makeItem()}
        onToggle={noop}
        onEdit={noop}
        onMoveUp={noop}
        onMoveDown={noop}
        isFirst={false}
        isLast={false}
      />,
    );
    expect(screen.getByLabelText('Edit Milk')).toBeOnTheScreen();
    expect(screen.getByLabelText('Move Milk up')).toBeOnTheScreen();
    expect(screen.getByLabelText('Move Milk down')).toBeOnTheScreen();
  });

  it('marks the move buttons disabled at the boundary they cannot move past', async () => {
    await render(
      <ListItemRowView
        item={makeItem()}
        onToggle={noop}
        onEdit={noop}
        onMoveUp={noop}
        onMoveDown={noop}
        isFirst
        isLast
      />,
    );
    expect(screen.getByLabelText('Move Milk up')).toBeDisabled();
    expect(screen.getByLabelText('Move Milk down')).toBeDisabled();
  });
});

describe('QuickAddRow accessibility', () => {
  it('gives the icon-only add button an accessible label', async () => {
    await render(<QuickAddRow placeholder="Add an item" onAdd={noop} />);
    expect(screen.getByLabelText('Add item')).toBeOnTheScreen();
  });
});
