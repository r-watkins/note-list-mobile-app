import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { createList } from '@/features/lists/list.service';
import { runWrite } from '@/lib/errors';

/** Create a new list: just a title. Items/sublists are added on the detail screen after. */
export default function NewListScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');

  const handleCreate = () => {
    const trimmed = title.trim();
    if (trimmed.length === 0) {
      return;
    }
    const result = runWrite(() => createList({ title: trimmed }));
    if (result.ok) {
      router.replace({ pathname: '/lists/[id]', params: { id: result.value } });
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'New list' }} />
      <View className="flex-1 gap-4 bg-background p-4">
        <Input
          value={title}
          onChangeText={setTitle}
          placeholder="List title"
          autoFocus
          onSubmitEditing={handleCreate}
          returnKeyType="done"
        />
        <Button onPress={handleCreate} disabled={title.trim().length === 0}>
          <Text>Create list</Text>
        </Button>
      </View>
    </>
  );
}
