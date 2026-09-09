import { Pressable, View } from 'react-native';

import { Checkbox } from '@/components/ui/checkbox';
import { Text } from '@/components/ui/text';
import type { ListItemRow } from '@/features/lists/list.repository';

/** One row: a tappable checkbox for checkbox items, or a static row for text items. */
export function ListItemRowView({
  item,
  onToggle,
}: {
  item: ListItemRow;
  onToggle: (isChecked: boolean) => void;
}) {
  if (item.itemType === 'text') {
    return (
      <View className="min-h-11 flex-row items-center px-4 py-2">
        <Text className="flex-1 text-base">{item.content}</Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => onToggle(!item.isChecked)}
      className="min-h-11 flex-row items-center gap-3 px-4 py-2"
      accessibilityRole="checkbox"
      accessibilityState={{ checked: item.isChecked }}
      accessibilityLabel={item.content}
    >
      <Checkbox checked={item.isChecked} onCheckedChange={onToggle} />
      <Text
        className={item.isChecked ? 'flex-1 text-base text-dim line-through' : 'flex-1 text-base'}
      >
        {item.content}
      </Text>
    </Pressable>
  );
}
