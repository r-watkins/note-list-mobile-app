import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import type { LibraryContentTypeFilter, LibrarySort } from '@/features/library/library.repository';

const CONTENT_TYPE_OPTIONS: { value: LibraryContentTypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'list', label: 'Lists' },
  { value: 'note', label: 'Notes' },
];

const SORT_OPTIONS: { value: LibrarySort; label: string }[] = [
  { value: 'updated-desc', label: 'Last updated' },
  { value: 'title-asc', label: 'Title, A-Z' },
  { value: 'content-type', label: 'Content type' },
];

/**
 * Content-type + sort control for the Library screen (spec §7.3). Label filtering isn't
 * offered here yet - it's Task 34's job, once there's a real source of labels to choose
 * from (label.repository.ts doesn't exist until Task 43).
 */
export function LibraryFilterSortDialog({
  open,
  onOpenChange,
  contentType,
  onContentTypeChange,
  sort,
  onSortChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: LibraryContentTypeFilter;
  onContentTypeChange: (value: LibraryContentTypeFilter) => void;
  sort: LibrarySort;
  onSortChange: (value: LibrarySort) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Filter & sort</DialogTitle>
        </DialogHeader>
        <Text className="text-dim text-sm">Show</Text>
        {CONTENT_TYPE_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={contentType === option.value ? 'secondary' : 'ghost'}
            className="justify-start"
            accessibilityRole="radio"
            accessibilityState={{ selected: contentType === option.value }}
            onPress={() => onContentTypeChange(option.value)}
          >
            <Text>{option.label}</Text>
          </Button>
        ))}
        <Text className="text-dim mt-2 text-sm">Sort by</Text>
        {SORT_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={sort === option.value ? 'secondary' : 'ghost'}
            className="justify-start"
            accessibilityRole="radio"
            accessibilityState={{ selected: sort === option.value }}
            onPress={() => onSortChange(option.value)}
          >
            <Text>{option.label}</Text>
          </Button>
        ))}
      </DialogContent>
    </Dialog>
  );
}
