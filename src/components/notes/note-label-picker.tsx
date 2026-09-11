import { Alert, View } from 'react-native';

import { QuickAddRow } from '@/components/lists/quick-add-row';
import { Text } from '@/components/ui/text';
import { PressableChip } from '@/components/ui/pressable-chip';
import { useLabels } from '@/features/labels/label.hooks';
import { createLabel, DuplicateLabelNameError } from '@/features/labels/label.service';

/**
 * Multi-select label assignment for the note editor (spec §6.3/§11.3): every existing label
 * as a toggleable chip, plus an inline "new label" row that creates a label and immediately
 * selects it. Selection lives in the parent's state (new.tsx/edit.tsx own labelIds) so it
 * flows into the same Save action as the title/body, rather than writing associations early.
 */
export function NoteLabelPicker({
  selectedLabelIds,
  onChange,
}: {
  selectedLabelIds: string[];
  onChange: (labelIds: string[]) => void;
}) {
  const labels = useLabels();
  const selected = new Set(selectedLabelIds);

  const toggle = (labelId: string) => {
    const next = new Set(selected);
    if (next.has(labelId)) {
      next.delete(labelId);
    } else {
      next.add(labelId);
    }
    onChange(Array.from(next));
  };

  const handleCreate = (name: string) => {
    try {
      const id = createLabel(name);
      onChange([...selectedLabelIds, id]);
    } catch (error) {
      if (error instanceof DuplicateLabelNameError) {
        Alert.alert('Name already in use', error.message);
      } else {
        console.error('Write failed:', error);
        Alert.alert('Something went wrong', 'Your change could not be saved. Please try again.');
      }
    }
  };

  return (
    <View className="gap-2 px-4 pb-2">
      <Text className="text-dim text-xs">Labels</Text>
      {labels.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {labels.map((label) => (
            <PressableChip
              key={label.id}
              label={label.name}
              selected={selected.has(label.id)}
              onPress={() => toggle(label.id)}
            />
          ))}
        </View>
      ) : null}
      <QuickAddRow placeholder="New label" onAdd={handleCreate} />
    </View>
  );
}
