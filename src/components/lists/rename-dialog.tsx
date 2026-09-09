import { useState } from 'react';

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

/** A small "rename X" prompt - shared by the list and sublist overflow menus. */
export function RenameDialog({
  open,
  onOpenChange,
  title,
  initialValue,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initialValue: string;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);

  const handleSave = () => {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return;
    }
    onSubmit(trimmed);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Input
          value={value}
          onChangeText={setValue}
          autoFocus
          onSubmitEditing={handleSave}
          returnKeyType="done"
        />
        <DialogFooter>
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            <Text>Cancel</Text>
          </Button>
          <Button onPress={handleSave} disabled={value.trim().length === 0}>
            <Text>Save</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
