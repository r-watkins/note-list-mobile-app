import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Checkbox } from '@/components/ui/checkbox';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { ListItemRow } from '@/features/lists/list.repository';

/** One row: a tappable checkbox (checkbox items only), tap-to-edit text, and move up/down. */
export function ListItemRowView({
  item,
  onToggle,
  onEdit,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  item: ListItemRow;
  onToggle: (isChecked: boolean) => void;
  onEdit: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
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
      <View className="flex-col">
        <Pressable
          onPress={onMoveUp}
          disabled={isFirst}
          accessibilityRole="button"
          accessibilityLabel={`Move ${item.content} up`}
          accessibilityState={{ disabled: isFirst }}
          className="h-9 w-9 items-center justify-center"
        >
          <Icon as={ChevronUp} size={16} className={isFirst ? 'opacity-30' : undefined} />
        </Pressable>
        <Pressable
          onPress={onMoveDown}
          disabled={isLast}
          accessibilityRole="button"
          accessibilityLabel={`Move ${item.content} down`}
          accessibilityState={{ disabled: isLast }}
          className="h-9 w-9 items-center justify-center"
        >
          <Icon as={ChevronDown} size={16} className={isLast ? 'opacity-30' : undefined} />
        </Pressable>
      </View>
    </View>
  );
}
