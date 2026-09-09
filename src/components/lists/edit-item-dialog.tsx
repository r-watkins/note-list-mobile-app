import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { deleteListItem, updateListItem, type ListItemRow } from '@/features/lists/list.repository';
import { runWrite } from '@/lib/errors';

/** Edit an item's text and checkbox/text type (spec §5.2, §11.2), or delete it. */
export function EditItemDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ListItemRow;
}) {
  const [content, setContent] = useState(item.content);
  const [itemType, setItemType] = useState(item.itemType);

  const handleSave = () => {
    const trimmed = content.trim();
    if (trimmed.length === 0) {
      return;
    }
    const result = runWrite(() =>
      updateListItem(
        item.id,
        // A text item's checked state is never meaningful (spec §8.1) - clear it on switching.
        { content: trimmed, itemType, isChecked: itemType === 'checkbox' ? item.isChecked : false },
        new Date(),
      ),
    );
    if (result.ok) {
      onOpenChange(false);
    }
  };

  const handleDelete = () => {
    onOpenChange(false);
    Alert.alert('Delete item?', `This will permanently delete "${item.content}".`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => runWrite(() => deleteListItem(item.id)),
      },
    ]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit item</DialogTitle>
        </DialogHeader>
        <Input
          value={content}
          onChangeText={setContent}
          autoFocus
          onSubmitEditing={handleSave}
          returnKeyType="done"
        />
        {/* Not flex-1: combined with the Button base's shrink-0, that truncates the label
        to its first character on Android (isolated by removing it) - fixed width instead. */}
        <View className="flex-row justify-center gap-2">
          <Button
            variant={itemType === 'checkbox' ? 'default' : 'outline'}
            className="w-36"
            onPress={() => setItemType('checkbox')}
          >
            <Text>Checkbox</Text>
          </Button>
          <Button
            variant={itemType === 'text' ? 'default' : 'outline'}
            className="w-36"
            onPress={() => setItemType('text')}
          >
            <Text>Text</Text>
          </Button>
        </View>
        <DialogFooter>
          <Button variant="ghost" onPress={handleDelete}>
            <Text className="text-destructive">Delete</Text>
          </Button>
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            <Text>Cancel</Text>
          </Button>
          <Button onPress={handleSave} disabled={content.trim().length === 0}>
            <Text>Save</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
