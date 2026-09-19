import { ChevronDown, ChevronUp, MoreVertical } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { QuickAddRow } from '@/components/lists/quick-add-row';
import { ListItemRowView } from '@/components/lists/list-item-row';
import type { ListDetailRow } from '@/features/lists/list-detail-rows';
import type { ListItemRow } from '@/features/lists/list.repository';
import type { MoveDirection } from '@/features/lists/list.service';
import { cn } from '@/lib/utils';

/**
 * Reproduces the Card visual (rounded-xl border box) for a row that's part of a virtualized
 * FlashList rather than physically nested inside a single <Card> - see list-detail-rows.ts's
 * header comment for why. Every row in a group shares the same bg/side-borders; only the
 * group's first row gets the top rounding/border and only its last (always a 'quick-add' row)
 * gets the bottom rounding/border/margin.
 */
function cardEdgeClassName({
  roundedTop,
  borderTop,
  roundedBottom,
}: {
  roundedTop: boolean;
  borderTop: boolean;
  roundedBottom: boolean;
}) {
  return cn(
    'mx-4 border-x border-border bg-card',
    roundedTop && 'rounded-t-xl border-t',
    !roundedTop && borderTop && 'border-t',
    roundedBottom && 'rounded-b-xl border-b mb-4',
  );
}

export function ListDetailRowView({
  row,
  onToggleItem,
  onEditItem,
  onMoveItem,
  onAddItem,
  onMoveSublist,
  onOpenSublistOverflow,
  onAddSublistPress,
  onQuickAddFocus,
}: {
  row: ListDetailRow;
  onToggleItem: (itemId: string, isChecked: boolean) => void;
  onEditItem: (item: ListItemRow) => void;
  onMoveItem: (itemId: string, direction: MoveDirection) => void;
  onAddItem: (sublistId: string | null, content: string) => void;
  onMoveSublist: (sublistId: string, direction: MoveDirection) => void;
  onOpenSublistOverflow: (sublistId: string) => void;
  onAddSublistPress: () => void;
  onQuickAddFocus: (rowKey: string) => void;
}) {
  if (row.kind === 'item') {
    return (
      <View
        className={cardEdgeClassName({
          roundedTop: row.roundedTop,
          borderTop: row.borderTop,
          roundedBottom: false,
        })}
      >
        <ListItemRowView
          item={row.item}
          onToggle={(checked) => onToggleItem(row.item.id, checked)}
          onEdit={() => onEditItem(row.item)}
          onMoveUp={() => onMoveItem(row.item.id, 'up')}
          onMoveDown={() => onMoveItem(row.item.id, 'down')}
          isFirst={row.isFirstMovable}
          isLast={row.isLastMovable}
        />
      </View>
    );
  }

  if (row.kind === 'quick-add') {
    return (
      <View
        className={cardEdgeClassName({
          roundedTop: row.roundedTop,
          borderTop: row.borderTop,
          roundedBottom: true,
        })}
      >
        <QuickAddRow
          placeholder={row.placeholder}
          onAdd={(content) => onAddItem(row.sublistId, content)}
          onFocus={() => onQuickAddFocus(row.key)}
        />
      </View>
    );
  }

  if (row.kind === 'sublist-header') {
    const checkboxItems = row.sublist.items.filter((item) => item.itemType === 'checkbox');
    const checkedCount = checkboxItems.filter((item) => item.isChecked).length;
    return (
      <View
        className={cardEdgeClassName({ roundedTop: true, borderTop: false, roundedBottom: false })}
      >
        <View className="flex-row items-center justify-between gap-2 px-4 py-3">
          <Text className="flex-1 text-lg font-semibold">{row.sublist.title}</Text>
          {checkboxItems.length > 0 ? (
            <Text className="text-dim text-sm">
              {checkedCount}/{checkboxItems.length}
            </Text>
          ) : null}
          <View className="flex-col">
            <Pressable
              onPress={() => onMoveSublist(row.sublist.id, 'up')}
              disabled={row.isFirstMovable}
              accessibilityRole="button"
              accessibilityLabel={`Move ${row.sublist.title} sublist up`}
              accessibilityState={{ disabled: row.isFirstMovable }}
              className="h-9 w-9 items-center justify-center"
            >
              <Icon
                as={ChevronUp}
                size={16}
                className={row.isFirstMovable ? 'opacity-30' : undefined}
              />
            </Pressable>
            <Pressable
              onPress={() => onMoveSublist(row.sublist.id, 'down')}
              disabled={row.isLastMovable}
              accessibilityRole="button"
              accessibilityLabel={`Move ${row.sublist.title} sublist down`}
              accessibilityState={{ disabled: row.isLastMovable }}
              className="h-9 w-9 items-center justify-center"
            >
              <Icon
                as={ChevronDown}
                size={16}
                className={row.isLastMovable ? 'opacity-30' : undefined}
              />
            </Pressable>
          </View>
          <Pressable
            onPress={() => onOpenSublistOverflow(row.sublist.id)}
            accessibilityLabel={`${row.sublist.title} actions`}
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center"
          >
            <Icon as={MoreVertical} size={18} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <Button variant="outline" className="mx-4 mb-4" onPress={onAddSublistPress}>
      <Text>Add sublist</Text>
    </Button>
  );
}
