import { FlashList } from '@shopify/flash-list';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MoreVertical } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { EditItemDialog } from '@/components/lists/edit-item-dialog';
import { ListDetailRowView } from '@/components/lists/list-detail-row';
import { ListOverflowMenu } from '@/components/lists/list-overflow-menu';
import { RenameDialog } from '@/components/lists/rename-dialog';
import { SublistOverflowMenu } from '@/components/lists/sublist-overflow-menu';
import { buildListDetailRows, type ListDetailRow } from '@/features/lists/list-detail-rows';
import { nextSortOrder, useListDetail } from '@/features/lists/list.hooks';
import {
  insertListItem,
  insertSublist,
  updateListItem,
  type ListItemRow,
} from '@/features/lists/list.repository';
import { moveListItem, moveSublist, type MoveDirection } from '@/features/lists/list.service';
import { runWrite } from '@/lib/errors';
import { hapticCheckboxToggle } from '@/lib/haptics';
import { generateId } from '@/lib/id';

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { entry, rootItems, sublists } = useListDetail(id);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [addSublistOpen, setAddSublistOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ListItemRow | null>(null);
  const [overflowSublistId, setOverflowSublistId] = useState<string | null>(null);

  // Spec §13: "long list views" must use a virtualized list, same as Library's FlashList -
  // root items, every sublist's header/items/quick-add, and the trailing button are
  // flattened into one row array so a single FlashList virtualizes the whole screen (a list
  // with thousands of items previously rendered via ScrollView + .map() failed to render at
  // all - see design.md's Task 52 amendment).
  const rows = useMemo(() => buildListDetailRows(rootItems, sublists), [rootItems, sublists]);
  const overflowSublist = sublists.find((s) => s.id === overflowSublistId);

  if (!entry) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'List' }} />
        <View className="flex-1 items-center justify-center bg-background p-6">
          <Text className="text-dim text-center">This list could not be found.</Text>
        </View>
      </>
    );
  }

  const handleToggleItem = (itemId: string, isChecked: boolean) => {
    hapticCheckboxToggle();
    runWrite(() => updateListItem(itemId, { isChecked }, new Date()));
  };

  const handleAddItem = (sublistId: string | null, content: string) => {
    const sublist = sublists.find((s) => s.id === sublistId);
    runWrite(() =>
      insertListItem({
        id: generateId(),
        listEntryId: entry.id,
        sublistId,
        itemType: 'checkbox',
        content,
        sortOrder: nextSortOrder(sublistId === null ? rootItems : (sublist?.items ?? [])),
        now: new Date(),
      }),
    );
  };

  const handleAddSublist = (title: string) => {
    runWrite(() =>
      insertSublist({
        id: generateId(),
        listEntryId: entry.id,
        title,
        sortOrder: nextSortOrder(sublists),
        now: new Date(),
      }),
    );
  };

  const handleMoveItem = (itemId: string, direction: MoveDirection) => {
    runWrite(() => moveListItem(itemId, direction));
  };

  const handleMoveSublist = (sublistId: string, direction: MoveDirection) => {
    runWrite(() => moveSublist(sublistId, direction));
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: entry.title,
          headerRight: () => (
            <Pressable
              onPress={() => setOverflowOpen(true)}
              accessibilityLabel="List actions"
              accessibilityRole="button"
              className="h-11 w-11 items-center justify-center"
            >
              <Icon as={MoreVertical} />
            </Pressable>
          ),
        }}
      />
      <View className="flex-1 bg-background">
        <FlashList<ListDetailRow>
          data={rows}
          keyExtractor={(row) => row.key}
          getItemType={(row) => row.kind}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
          renderItem={({ item: row }) => (
            <ListDetailRowView
              row={row}
              onToggleItem={handleToggleItem}
              onEditItem={setEditingItem}
              onMoveItem={handleMoveItem}
              onAddItem={handleAddItem}
              onMoveSublist={handleMoveSublist}
              onOpenSublistOverflow={setOverflowSublistId}
              onAddSublistPress={() => setAddSublistOpen(true)}
            />
          )}
        />
      </View>
      <ListOverflowMenu
        open={overflowOpen}
        onOpenChange={setOverflowOpen}
        entryId={entry.id}
        listTitle={entry.title}
        onDeleted={() => router.back()}
      />
      <RenameDialog
        key={addSublistOpen ? 'open' : 'closed'}
        open={addSublistOpen}
        onOpenChange={setAddSublistOpen}
        title="Add sublist"
        initialValue=""
        placeholder="Sublist title"
        submitLabel="Add"
        onSubmit={handleAddSublist}
      />
      {editingItem ? (
        <EditItemDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setEditingItem(null);
            }
          }}
          item={editingItem}
        />
      ) : null}
      {overflowSublist ? (
        <SublistOverflowMenu
          open={overflowSublistId !== null}
          onOpenChange={(open) => {
            if (!open) {
              setOverflowSublistId(null);
            }
          }}
          sublistId={overflowSublist.id}
          sublistTitle={overflowSublist.title}
        />
      ) : null}
    </>
  );
}
