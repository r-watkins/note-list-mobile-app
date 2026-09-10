import { FileText, ListChecks } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { LibraryEntryWithLabels } from '@/features/library/library.repository';

/**
 * Minimal Library row: type indicator + title. Deliberately bare-bones - Task 35 owns
 * building out the full row (match preview, labels, formatted update time, guaranteed
 * 44x44pt touch targets per spec §7.4) as its own dedicated task; this just proves the
 * list renders and list-type rows navigate.
 */
export function LibraryResultRow({
  entry,
  onPress,
}: {
  entry: LibraryEntryWithLabels;
  onPress?: () => void;
}) {
  const row = (
    <View className="min-h-11 flex-row items-center gap-3 px-4 py-3">
      <Icon
        as={entry.entryType === 'list' ? ListChecks : FileText}
        size={20}
        className="text-dim"
      />
      <Text className="flex-1 text-base" numberOfLines={1}>
        {entry.title}
      </Text>
    </View>
  );

  if (!onPress) {
    return row;
  }

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={entry.title}>
      {row}
    </Pressable>
  );
}
