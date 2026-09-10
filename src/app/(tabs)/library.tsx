import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { Plus, SlidersHorizontal } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { LibraryEmptyState } from '@/components/library/library-empty-state';
import { LibraryFilterSortDialog } from '@/components/library/library-filter-sort-dialog';
import { LibraryResultRow } from '@/components/library/library-result-row';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useLibraryEntries } from '@/features/library/library.hooks';
import {
  getListSearchMatchPreview,
  type LibraryContentTypeFilter,
  type LibraryEntryWithLabels,
  type LibrarySort,
} from '@/features/library/library.repository';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

/** Spec §7.2: "debounce database-backed search by approximately 150-250ms." */
const SEARCH_DEBOUNCE_MS = 200;

export default function LibraryScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const debouncedSearchText = useDebouncedValue(searchText, SEARCH_DEBOUNCE_MS);
  const [contentType, setContentType] = useState<LibraryContentTypeFilter>('all');
  const [labelId, setLabelId] = useState<string | undefined>(undefined);
  const [sort, setSort] = useState<LibrarySort>('updated-desc');
  const [filterSortOpen, setFilterSortOpen] = useState(false);

  const entries = useLibraryEntries({ contentType, labelId, query: debouncedSearchText }, sort);

  // A list's contextual match preview (spec §7.4, e.g. "Dairy · Milk") only makes sense
  // while actively searching, and only for list-type entries (notes show labels instead
  // - see LibraryResultRow). Recomputed only when the result set or query text changes,
  // not on every render, since each lookup is its own small DB read.
  const matchPreviewByEntryId = useMemo(() => {
    const trimmedQuery = debouncedSearchText.trim();
    const byEntryId = new Map<string, string>();
    if (!trimmedQuery) {
      return byEntryId;
    }
    for (const entry of entries) {
      if (entry.entryType !== 'list') {
        continue;
      }
      const preview = getListSearchMatchPreview(entry, trimmedQuery);
      if (preview) {
        byEntryId.set(entry.id, preview);
      }
    }
    return byEntryId;
  }, [entries, debouncedSearchText]);

  // Labels only ever attach to notes (spec §7.3) - reflect that in contentType too, so
  // the dialog doesn't show a stale "Lists"/"All" selection contradicting what's showing.
  const handleLabelIdChange = (value: string | undefined) => {
    setLabelId(value);
    if (value !== undefined) {
      setContentType('note');
    }
  };

  // Only true when no filter/search is active at all - in that case `entries` already
  // is the entire, unfiltered library, so an empty result means the library itself is
  // empty rather than that the current filter/search just has no matches.
  const isLibraryEmpty =
    entries.length === 0 &&
    contentType === 'all' &&
    labelId === undefined &&
    debouncedSearchText.trim().length === 0;

  const handlePressEntry = (entry: LibraryEntryWithLabels) => {
    // Notes have no detail screen yet (Task 41) - only list rows are pressable for now.
    router.push({ pathname: '/lists/[id]', params: { id: entry.id } });
  };

  return (
    <View className="flex-1 bg-background">
      <View className="gap-3 px-4 pb-3 pt-4">
        <Text className="text-2xl font-semibold">Library</Text>
        <View className="flex-row items-center gap-2">
          <Input
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search lists and notes"
            className="flex-1"
            accessibilityLabel="Search lists and notes"
            returnKeyType="search"
          />
          <Button
            variant="outline"
            size="icon"
            onPress={() => setFilterSortOpen(true)}
            accessibilityLabel="Filter and sort"
          >
            <Icon as={SlidersHorizontal} />
          </Button>
        </View>
      </View>
      <View className="flex-1">
        <FlashList
          data={entries}
          keyExtractor={(entry) => entry.id}
          renderItem={({ item }) => (
            <LibraryResultRow
              entry={item}
              matchPreview={matchPreviewByEntryId.get(item.id)}
              onPress={item.entryType === 'list' ? () => handlePressEntry(item) : undefined}
            />
          )}
          ListEmptyComponent={
            <LibraryEmptyState
              isLibraryEmpty={isLibraryEmpty}
              query={debouncedSearchText}
              contentType={contentType}
              labelActive={labelId !== undefined}
            />
          }
        />
      </View>
      <Pressable
        onPress={() => router.push('/lists/new')}
        accessibilityRole="button"
        accessibilityLabel="Create new list"
        className="bg-primary active:bg-primary/90 absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full shadow-lg shadow-black/20"
      >
        <Icon as={Plus} className="text-primary-foreground" size={24} />
      </Pressable>
      <LibraryFilterSortDialog
        open={filterSortOpen}
        onOpenChange={setFilterSortOpen}
        contentType={contentType}
        onContentTypeChange={setContentType}
        labelId={labelId}
        onLabelIdChange={handleLabelIdChange}
        sort={sort}
        onSortChange={setSort}
      />
    </View>
  );
}
