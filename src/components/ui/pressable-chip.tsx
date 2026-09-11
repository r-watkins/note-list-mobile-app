import { Pressable } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

/** A toggleable pill - selected/unselected visual state plus the matching accessibility state. */
export function PressableChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}, ${selected ? 'selected' : 'not selected'}`}
      className={cn('rounded-full px-3 py-1.5', selected ? 'bg-primary' : 'bg-elevated')}
    >
      <Text className={cn('text-sm', selected ? 'text-primary-foreground' : 'text-dim')}>
        {label}
      </Text>
    </Pressable>
  );
}
