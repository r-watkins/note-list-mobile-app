import { useState } from 'react';
import { Alert } from 'react-native';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Text } from '@/components/ui/text';
import { RenameDialog } from '@/components/lists/rename-dialog';
import { confirmedBulkSetChecked } from '@/features/lists/list.actions';
import { updateListEntryTitle } from '@/features/lists/list.repository';
import { deleteList } from '@/features/lists/list.service';
import { runWrite } from '@/lib/errors';
import { hapticDestructiveConfirm } from '@/lib/haptics';

/**
 * The list detail screen's overflow menu (spec §5.4, §11.2): check all / uncheck all /
 * rename / delete. A centered Dialog rather than the bottom sheet spec §11.1 calls for -
 * design.md Decision #12: @gorhom/bottom-sheet's BottomSheetModal doesn't actually present
 * on-device in this project (confirmed via an isolated Dialog-vs-Sheet test), so every
 * planned bottom-sheet use is a Dialog until a working replacement is found.
 */
export function ListOverflowMenu({
  open,
  onOpenChange,
  entryId,
  listTitle,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entryId: string;
  listTitle: string;
  onDeleted: () => void;
}) {
  const [renameOpen, setRenameOpen] = useState(false);

  const handleDelete = () => {
    onOpenChange(false);
    Alert.alert(
      'Delete list?',
      `This will permanently delete "${listTitle}" and everything in it.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            hapticDestructiveConfirm();
            const result = runWrite(() => deleteList(entryId));
            if (result.ok) {
              onDeleted();
            }
          },
        },
      ],
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{listTitle}</DialogTitle>
          </DialogHeader>
          <Button
            variant="ghost"
            className="justify-start"
            onPress={() => {
              onOpenChange(false);
              confirmedBulkSetChecked({ type: 'list', listEntryId: entryId }, true);
            }}
          >
            <Text>Check all</Text>
          </Button>
          <Button
            variant="ghost"
            className="justify-start"
            onPress={() => {
              onOpenChange(false);
              confirmedBulkSetChecked({ type: 'list', listEntryId: entryId }, false);
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
            <Text>Rename list</Text>
          </Button>
          <Button variant="ghost" className="justify-start" onPress={handleDelete}>
            <Text className="text-destructive">Delete list</Text>
          </Button>
        </DialogContent>
      </Dialog>
      <RenameDialog
        key={renameOpen ? 'open' : 'closed'}
        open={renameOpen}
        onOpenChange={setRenameOpen}
        title="Rename list"
        initialValue={listTitle}
        onSubmit={(newTitle) => runWrite(() => updateListEntryTitle(entryId, newTitle, new Date()))}
      />
    </>
  );
}
