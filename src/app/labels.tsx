import { Stack } from 'expo-router';
import { Pencil, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, FlatList, Pressable, View } from 'react-native';

import { QuickAddRow } from '@/components/lists/quick-add-row';
import { RenameDialog } from '@/components/lists/rename-dialog';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useLabels } from '@/features/labels/label.hooks';
import type { LabelRow } from '@/features/labels/label.repository';
import {
  createLabel,
  DuplicateLabelNameError,
  removeLabel,
  renameLabel,
} from '@/features/labels/label.service';
import { hapticDestructiveConfirm } from '@/lib/haptics';

/**
 * Same contract as lib/errors.ts's runWrite, except a DuplicateLabelNameError gets its own
 * specific alert instead of the generic "something went wrong" fallback - the whole reason
 * label.service.ts throws a typed error instead of letting the DB's unique-constraint error
 * surface raw (see label.service.ts's createLabel/renameLabel comments).
 */
function runLabelWrite(operation: () => void): boolean {
  try {
    operation();
    return true;
  } catch (error) {
    if (error instanceof DuplicateLabelNameError) {
      Alert.alert('Name already in use', error.message);
    } else {
      console.error('Write failed:', error);
      Alert.alert('Something went wrong', 'Your change could not be saved. Please try again.');
    }
    return false;
  }
}

function LabelListRow({
  label,
  onRename,
  onDelete,
}: {
  label: LabelRow;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <View className="min-h-11 flex-row items-center gap-1 px-4 py-2">
      <Text className="flex-1 text-base">{label.name}</Text>
      <Pressable
        onPress={onRename}
        accessibilityRole="button"
        accessibilityLabel={`Rename ${label.name}`}
        className="h-11 w-11 items-center justify-center"
      >
        <Icon as={Pencil} size={18} />
      </Pressable>
      <Pressable
        onPress={onDelete}
        accessibilityRole="button"
        accessibilityLabel={`Delete ${label.name}`}
        className="h-11 w-11 items-center justify-center"
      >
        <Icon as={Trash2} size={18} className="text-destructive" />
      </Pressable>
    </View>
  );
}

export default function LabelsScreen() {
  const labels = useLabels();
  const [renamingLabel, setRenamingLabel] = useState<LabelRow | null>(null);

  const handleCreate = (name: string) => {
    runLabelWrite(() => createLabel(name));
  };

  const handleRename = (name: string) => {
    if (!renamingLabel) {
      return;
    }
    runLabelWrite(() => renameLabel(renamingLabel.id, name));
  };

  const handleDelete = (label: LabelRow) => {
    Alert.alert(
      'Delete label?',
      `This removes "${label.name}" from every note it's on. Notes themselves are not deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            hapticDestructiveConfirm();
            runLabelWrite(() => removeLabel(label.id));
          },
        },
      ],
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Labels' }} />
      <View className="flex-1 bg-background">
        <QuickAddRow placeholder="New label" onAdd={handleCreate} />
        <FlatList
          data={labels}
          keyExtractor={(label) => label.id}
          renderItem={({ item }) => (
            <LabelListRow
              label={item}
              onRename={() => setRenamingLabel(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
          ListEmptyComponent={
            <View className="items-center px-4 py-12">
              <Text className="text-dim text-center">
                No labels yet. Add one above to start organizing notes.
              </Text>
            </View>
          }
        />
      </View>
      <RenameDialog
        key={renamingLabel?.id ?? 'closed'}
        open={renamingLabel !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRenamingLabel(null);
          }
        }}
        title="Rename label"
        initialValue={renamingLabel?.name ?? ''}
        placeholder="Label name"
        onSubmit={handleRename}
      />
    </>
  );
}
