import { FileText, ListChecks } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { LibraryEntryWithLabels } from '@/features/library/library.repository';
import { formatRelativeTime } from '@/lib/format-relative-time';

/** Spec §7.4: "Its labels, limited gracefully if there are many." */
const MAX_VISIBLE_LABELS = 3;

/**
 * A Library result row (spec §7.4): a subtle type indicator, title, a contextual match
 * preview for a nested list search hit (e.g. "Dairy · Milk"), a note's labels, and a
 * relative/formatted update time - all within a >=44pt-tall touch target when tappable.
 */
export function LibraryResultRow({
  entry,
  matchPreview,
  onPress,
}: {
  entry: LibraryEntryWithLabels;
  /** A list's search-match context (e.g. "Dairy · Milk") - lists only; never set for notes. */
  matchPreview?: string;
  onPress?: () => void;
}) {
  const typeLabel = entry.entryType === 'list' ? 'List' : 'Note';
  const visibleLabels = entry.labels.slice(0, MAX_VISIBLE_LABELS);
  const hiddenLabelCount = entry.labels.length - visibleLabels.length;

  const row = (
    <View className="min-h-11 flex-row items-center gap-3 px-4 py-2">
      <Icon
        as={entry.entryType === 'list' ? ListChecks : FileText}
        size={20}
        className="text-dim shrink-0"
        accessibilityLabel={typeLabel}
      />
      <View className="flex-1 gap-0.5">
        <Text className="text-base" numberOfLines={1}>
          {entry.title}
        </Text>
        {matchPreview ? (
          <Text className="text-dim text-xs" numberOfLines={1}>
            {matchPreview}
          </Text>
        ) : null}
        {visibleLabels.length > 0 ? (
          <View className="flex-row flex-wrap gap-1 pt-0.5">
            {visibleLabels.map((label) => (
              <View key={label.id} className="bg-elevated rounded-full px-2 py-0.5">
                <Text className="text-dim text-xs">{label.name}</Text>
              </View>
            ))}
            {hiddenLabelCount > 0 ? (
              <Text className="text-dim self-center text-xs">+{hiddenLabelCount}</Text>
            ) : null}
          </View>
        ) : null}
      </View>
      <Text className="text-dim shrink-0 text-xs">{formatRelativeTime(entry.updatedAt)}</Text>
    </View>
  );

  if (!onPress) {
    return row;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${typeLabel}: ${entry.title}`}
    >
      {row}
    </Pressable>
  );
}
