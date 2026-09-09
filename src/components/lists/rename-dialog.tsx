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

/**
 * A small "rename X" prompt - shared by the list and sublist overflow menus, and (with an
 * empty initialValue) reused as a lightweight "new X" title prompt (e.g. adding a sublist).
 */
export function RenameDialog({
  open,
  onOpenChange,
  title,
  initialValue,
  placeholder,
  submitLabel = 'Save',
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initialValue: string;
  placeholder?: string;
  submitLabel?: string;
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
          placeholder={placeholder}
          autoFocus
          onSubmitEditing={handleSave}
          returnKeyType="done"
        />
        <DialogFooter>
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            <Text>Cancel</Text>
          </Button>
          <Button onPress={handleSave} disabled={value.trim().length === 0}>
            <Text>{submitLabel}</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
