import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MoreVertical } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { EditItemDialog } from '@/components/lists/edit-item-dialog';
import { ListItemRowView } from '@/components/lists/list-item-row';
import { ListOverflowMenu } from '@/components/lists/list-overflow-menu';
import { QuickAddRow } from '@/components/lists/quick-add-row';
import { RenameDialog } from '@/components/lists/rename-dialog';
import { SublistSection } from '@/components/lists/sublist-section';
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

  const handleAddRootItem = (content: string) => {
    runWrite(() =>
      insertListItem({
        id: generateId(),
        listEntryId: entry.id,
        sublistId: null,
        itemType: 'checkbox',
        content,
        sortOrder: nextSortOrder(rootItems),
        now: new Date(),
      }),
    );
  };

  const handleAddSublistItem = (sublistId: string, content: string) => {
    const sublist = sublists.find((s) => s.id === sublistId);
    runWrite(() =>
      insertListItem({
        id: generateId(),
        listEntryId: entry.id,
        sublistId,
        itemType: 'checkbox',
        content,
        sortOrder: nextSortOrder(sublist?.items ?? []),
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
      <ScrollView className="flex-1 bg-background" contentContainerClassName="py-4">
        <Card className="mx-4 mb-4 gap-0 py-0">
          <CardContent className="gap-0 px-0 pb-2">
            {rootItems.length > 0 ? (
              <View className="border-border border-t">
                {rootItems.map((item, index) => (
                  <ListItemRowView
                    key={item.id}
                    item={item}
                    onToggle={(checked) => handleToggleItem(item.id, checked)}
                    onEdit={() => setEditingItem(item)}
                    onMoveUp={() => handleMoveItem(item.id, 'up')}
                    onMoveDown={() => handleMoveItem(item.id, 'down')}
                    isFirst={index === 0}
                    isLast={index === rootItems.length - 1}
                  />
                ))}
              </View>
            ) : null}
            <QuickAddRow placeholder="Add an item" onAdd={handleAddRootItem} />
          </CardContent>
        </Card>

        {sublists.map((sublist, index) => (
          <SublistSection
            key={sublist.id}
            sublist={sublist}
            onToggleItem={handleToggleItem}
            onAddItem={(content) => handleAddSublistItem(sublist.id, content)}
            onEditItem={setEditingItem}
            onMoveItemUp={(itemId) => handleMoveItem(itemId, 'up')}
            onMoveItemDown={(itemId) => handleMoveItem(itemId, 'down')}
            onMoveUp={() => handleMoveSublist(sublist.id, 'up')}
            onMoveDown={() => handleMoveSublist(sublist.id, 'down')}
            isFirst={index === 0}
            isLast={index === sublists.length - 1}
          />
        ))}

        <Button variant="outline" className="mx-4" onPress={() => setAddSublistOpen(true)}>
          <Text>Add sublist</Text>
        </Button>
      </ScrollView>
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
    </>
  );
}
