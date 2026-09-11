import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useLabels } from '@/features/labels/label.hooks';
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

/** Content-type + label + sort control for the Library screen (spec §7.3). */
export function LibraryFilterSortDialog({
  open,
  onOpenChange,
  contentType,
  onContentTypeChange,
  labelId,
  onLabelIdChange,
  sort,
  onSortChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: LibraryContentTypeFilter;
  onContentTypeChange: (value: LibraryContentTypeFilter) => void;
  labelId: string | undefined;
  onLabelIdChange: (value: string | undefined) => void;
  sort: LibrarySort;
  onSortChange: (value: LibrarySort) => void;
}) {
  const labels = useLabels();
  const labelFilterActive = labelId !== undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Filter & sort</DialogTitle>
        </DialogHeader>
        <Text className="text-dim text-sm">Show</Text>
        {labelFilterActive ? (
          <Text className="text-dim text-xs">
            Only notes can show while a label filter is active.
          </Text>
        ) : null}
        {CONTENT_TYPE_OPTIONS.map((option) => {
          // Labels only ever attach to notes (spec §7.3) - a label filter forces notes-only,
          // so disable the other two options here rather than let them silently do nothing.
          const disabled = labelFilterActive && option.value !== 'note';
          return (
            <Button
              key={option.value}
              variant={contentType === option.value ? 'secondary' : 'ghost'}
              className="justify-start"
              accessibilityRole="radio"
              accessibilityState={{ selected: contentType === option.value, disabled }}
              disabled={disabled}
              onPress={() => onContentTypeChange(option.value)}
            >
              <Text>{option.label}</Text>
            </Button>
          );
        })}
        {labels.length > 0 ? (
          <>
            <Text className="text-dim mt-2 text-sm">Label (notes only)</Text>
            <Button
              variant={labelId === undefined ? 'secondary' : 'ghost'}
              className="justify-start"
              accessibilityRole="radio"
              accessibilityState={{ selected: labelId === undefined }}
              onPress={() => onLabelIdChange(undefined)}
            >
              <Text>Any</Text>
            </Button>
            {labels.map((label) => (
              <Button
                key={label.id}
                variant={labelId === label.id ? 'secondary' : 'ghost'}
                className="justify-start"
                accessibilityRole="radio"
                accessibilityState={{ selected: labelId === label.id }}
                onPress={() => onLabelIdChange(label.id)}
              >
                <Text>{label.name}</Text>
              </Button>
            ))}
          </>
        ) : null}
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
