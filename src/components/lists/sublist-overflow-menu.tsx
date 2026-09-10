import { useState } from 'react';
import { Alert } from 'react-native';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Text } from '@/components/ui/text';
import { RenameDialog } from '@/components/lists/rename-dialog';
import { confirmedBulkSetChecked } from '@/features/lists/list.actions';
import {
  deleteSublist,
  getSublistItemCount,
  updateSublistTitle,
} from '@/features/lists/list.repository';
import { runWrite } from '@/lib/errors';

/**
 * A sublist header's overflow menu (spec §5.3, §5.4): check all / uncheck all / rename /
 * delete - delete only confirms if the sublist is non-empty. A Dialog, not a bottom sheet
 * (design.md Decision #12).
 */
export function SublistOverflowMenu({
  open,
  onOpenChange,
  sublistId,
  sublistTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sublistId: string;
  sublistTitle: string;
}) {
  const [renameOpen, setRenameOpen] = useState(false);

  const handleDelete = () => {
    onOpenChange(false);
    const itemCount = getSublistItemCount(sublistId);
    if (itemCount === 0) {
      runWrite(() => deleteSublist(sublistId, new Date()));
      return;
    }
    Alert.alert(
      'Delete sublist?',
      `This will permanently delete "${sublistTitle}" and its ${itemCount} item${itemCount === 1 ? '' : 's'}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => runWrite(() => deleteSublist(sublistId, new Date())),
        },
      ],
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{sublistTitle}</DialogTitle>
          </DialogHeader>
          <Button
            variant="ghost"
            className="justify-start"
            onPress={() => {
              onOpenChange(false);
              confirmedBulkSetChecked({ type: 'sublist', sublistId }, true);
            }}
          >
            <Text>Check all</Text>
          </Button>
          <Button
            variant="ghost"
            className="justify-start"
            onPress={() => {
              onOpenChange(false);
              confirmedBulkSetChecked({ type: 'sublist', sublistId }, false);
            }}
          >
            <Text>Uncheck all</Text>
          </Button>
          <Button
            variant="ghost"
            className="justify-start"
            onPress={() => {
              onOpenChange(false);
              setRenameOpen(true);
            }}
          >
            <Text>Rename sublist</Text>
          </Button>
          <Button variant="ghost" className="justify-start" onPress={handleDelete}>
            <Text className="text-destructive">Delete sublist</Text>
          </Button>
        </DialogContent>
      </Dialog>
      <RenameDialog
        key={renameOpen ? 'open' : 'closed'}
        open={renameOpen}
        onOpenChange={setRenameOpen}
        title="Rename sublist"
        initialValue={sublistTitle}
        onSubmit={(newTitle) => runWrite(() => updateSublistTitle(sublistId, newTitle, new Date()))}
      />
    </>
  );
}
