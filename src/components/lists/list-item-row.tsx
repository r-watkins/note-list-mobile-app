import { Pressable, View } from 'react-native';

import { Checkbox } from '@/components/ui/checkbox';
import { Text } from '@/components/ui/text';
import type { ListItemRow } from '@/features/lists/list.repository';

/** One row: a tappable checkbox (checkbox items only) plus tap-to-edit text. */
export function ListItemRowView({
  item,
  onToggle,
  onEdit,
}: {
  item: ListItemRow;
  onToggle: (isChecked: boolean) => void;
  onEdit: () => void;
}) {
  return (
    <View className="min-h-11 flex-row items-center gap-3 px-4 py-2">
      {item.itemType === 'checkbox' ? (
        <Checkbox
          checked={item.isChecked}
          onCheckedChange={onToggle}
          accessibilityLabel={item.content}
        />
      ) : null}
      <Pressable
        onPress={onEdit}
        className="flex-1 py-1"
        accessibilityRole="button"
        accessibilityLabel={`Edit ${item.content}`}
      >
        <Text
          className={
            item.itemType === 'checkbox' && item.isChecked
              ? 'text-base text-dim line-through'
              : 'text-base'
          }
        >
          {item.content}
        </Text>
      </Pressable>
    </View>
  );
}
