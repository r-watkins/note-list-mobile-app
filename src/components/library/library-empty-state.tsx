import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import type { LibraryContentTypeFilter } from '@/features/library/library.repository';

/**
 * Library's empty and no-results states (spec §7 - implied by the base "list of matching
 * entries" requirement; distinct copy for a brand-new library vs. a filter/search that
 * simply has no matches, so the user isn't told "empty" when they've just filtered too
 * narrowly).
 */
export function LibraryEmptyState({
  isLibraryEmpty,
  query,
  contentType,
  labelActive,
}: {
  /** True only when nothing exists in the library at all - no filter/search is active. */
  isLibraryEmpty: boolean;
  query: string;
  contentType: LibraryContentTypeFilter;
  labelActive: boolean;
}) {
  if (isLibraryEmpty) {
    return (
      <View className="flex-1 items-center justify-center gap-1 px-8 py-16">
        <Text className="text-lg font-medium">Your library is empty</Text>
        <Text className="text-dim text-center text-sm">Tap + to create your first list.</Text>
      </View>
    );
  }

  const trimmedQuery = query.trim();
  let message: string;
  if (trimmedQuery.length > 0) {
    message = `No results for "${trimmedQuery}"`;
  } else if (labelActive) {
    message = 'No notes with this label';
  } else if (contentType === 'list') {
    message = 'No lists yet';
  } else if (contentType === 'note') {
    message = 'No notes yet';
  } else {
    message = 'No results';
  }

  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Text className="text-dim text-center text-sm">{message}</Text>
    </View>
  );
}
