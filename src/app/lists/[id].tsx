import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MoreVertical } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ListItemRowView } from '@/components/lists/list-item-row';
import { ListOverflowMenu } from '@/components/lists/list-overflow-menu';
import { QuickAddRow } from '@/components/lists/quick-add-row';
import { SublistSection } from '@/components/lists/sublist-section';
import { nextSortOrder, useListDetail } from '@/features/lists/list.hooks';
import { insertListItem, updateListItem } from '@/features/lists/list.repository';
import { generateId } from '@/lib/id';

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { entry, rootItems, sublists } = useListDetail(id);
  const [overflowOpen, setOverflowOpen] = useState(false);

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
    updateListItem(itemId, { isChecked }, new Date());
  };

  const handleAddRootItem = (content: string) => {
    insertListItem({
      id: generateId(),
      listEntryId: entry.id,
      sublistId: null,
      itemType: 'checkbox',
      content,
      sortOrder: nextSortOrder(rootItems),
      now: new Date(),
    });
  };

  const handleAddSublistItem = (sublistId: string, content: string) => {
    const sublist = sublists.find((s) => s.id === sublistId);
    insertListItem({
      id: generateId(),
      listEntryId: entry.id,
      sublistId,
      itemType: 'checkbox',
      content,
      sortOrder: nextSortOrder(sublist?.items ?? []),
      now: new Date(),
    });
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
                {rootItems.map((item) => (
                  <ListItemRowView
                    key={item.id}
                    item={item}
                    onToggle={(checked) => handleToggleItem(item.id, checked)}
                  />
                ))}
              </View>
            ) : null}
            <QuickAddRow placeholder="Add an item" onAdd={handleAddRootItem} />
          </CardContent>
        </Card>

        {sublists.map((sublist) => (
          <SublistSection
            key={sublist.id}
            sublist={sublist}
            onToggleItem={handleToggleItem}
            onAddItem={(content) => handleAddSublistItem(sublist.id, content)}
          />
        ))}
      </ScrollView>
      <ListOverflowMenu
        open={overflowOpen}
        onOpenChange={setOverflowOpen}
        entryId={entry.id}
        listTitle={entry.title}
        onDeleted={() => router.back()}
      />
    </>
  );
}
