import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';

/** Inline "+ add an item" row - type text, submit via the keyboard or the button. */
export function QuickAddRow({
  placeholder,
  onAdd,
  onFocus,
}: {
  placeholder: string;
  onAdd: (content: string) => void;
  onFocus?: () => void;
}) {
  const [text, setText] = useState('');

  const submit = () => {
    const content = text.trim();
    if (content.length === 0) {
      return;
    }
    onAdd(content);
    setText('');
  };

  return (
    <View className="flex-row items-center gap-2 px-4 py-2">
      <Input
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        onFocus={onFocus}
        onSubmitEditing={submit}
        returnKeyType="done"
        className="flex-1"
        accessibilityLabel={placeholder}
      />
      <Button
        variant="ghost"
        size="icon"
        onPress={submit}
        disabled={text.trim().length === 0}
        accessibilityLabel="Add item"
      >
        <Icon as={Plus} />
      </Button>
    </View>
  );
}
