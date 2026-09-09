import { View } from 'react-native';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { QuickAddRow } from '@/components/lists/quick-add-row';
import { ListItemRowView } from '@/components/lists/list-item-row';
import type { SublistWithItems } from '@/features/lists/list.repository';

/** A named grouping within a list (spec §5.3): title, checked/total progress, items, quick-add. */
export function SublistSection({
  sublist,
  onToggleItem,
  onAddItem,
}: {
  sublist: SublistWithItems;
  onToggleItem: (itemId: string, isChecked: boolean) => void;
  onAddItem: (content: string) => void;
}) {
  const checkboxItems = sublist.items.filter((item) => item.itemType === 'checkbox');
  const checkedCount = checkboxItems.filter((item) => item.isChecked).length;

  return (
    <Card className="mx-4 mb-4 gap-0 py-0">
      <CardHeader className="flex-row items-center justify-between gap-2 px-4 py-3">
        <Text className="text-lg font-semibold">{sublist.title}</Text>
        {checkboxItems.length > 0 ? (
          <Text className="text-dim text-sm">
            {checkedCount}/{checkboxItems.length}
          </Text>
        ) : null}
      </CardHeader>
      <CardContent className="gap-0 px-0 pb-2">
        {sublist.items.length > 0 ? (
          <View className="border-t border-border">
            {sublist.items.map((item) => (
              <ListItemRowView
                key={item.id}
                item={item}
                onToggle={(checked) => onToggleItem(item.id, checked)}
              />
            ))}
          </View>
        ) : null}
        <QuickAddRow placeholder={`Add item to ${sublist.title}`} onAdd={onAddItem} />
      </CardContent>
    </Card>
  );
}
