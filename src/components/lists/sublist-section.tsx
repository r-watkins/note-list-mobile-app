import { MoreVertical } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { QuickAddRow } from '@/components/lists/quick-add-row';
import { ListItemRowView } from '@/components/lists/list-item-row';
import { SublistOverflowMenu } from '@/components/lists/sublist-overflow-menu';
import type { ListItemRow, SublistWithItems } from '@/features/lists/list.repository';

/** A named grouping within a list (spec §5.3): title, checked/total progress, items, quick-add. */
export function SublistSection({
  sublist,
  onToggleItem,
  onAddItem,
  onEditItem,
}: {
  sublist: SublistWithItems;
  onToggleItem: (itemId: string, isChecked: boolean) => void;
  onAddItem: (content: string) => void;
  onEditItem: (item: ListItemRow) => void;
}) {
  const checkboxItems = sublist.items.filter((item) => item.itemType === 'checkbox');
  const checkedCount = checkboxItems.filter((item) => item.isChecked).length;
  const [overflowOpen, setOverflowOpen] = useState(false);

  return (
    <Card className="mx-4 mb-4 gap-0 py-0">
      <CardHeader className="flex-row items-center justify-between gap-2 px-4 py-3">
        <Text className="flex-1 text-lg font-semibold">{sublist.title}</Text>
        {checkboxItems.length > 0 ? (
          <Text className="text-dim text-sm">
            {checkedCount}/{checkboxItems.length}
          </Text>
        ) : null}
        <Pressable
          onPress={() => setOverflowOpen(true)}
          accessibilityLabel={`${sublist.title} actions`}
          accessibilityRole="button"
          className="h-11 w-11 items-center justify-center"
        >
          <Icon as={MoreVertical} size={18} />
        </Pressable>
      </CardHeader>
      <SublistOverflowMenu
        open={overflowOpen}
        onOpenChange={setOverflowOpen}
        sublistId={sublist.id}
        sublistTitle={sublist.title}
      />
      <CardContent className="gap-0 px-0 pb-2">
        {sublist.items.length > 0 ? (
          <View className="border-t border-border">
            {sublist.items.map((item) => (
              <ListItemRowView
                key={item.id}
                item={item}
                onToggle={(checked) => onToggleItem(item.id, checked)}
                onEdit={() => onEditItem(item)}
              />
            ))}
          </View>
        ) : null}
        <QuickAddRow placeholder={`Add item to ${sublist.title}`} onAdd={onAddItem} />
      </CardContent>
    </Card>
  );
}
