import { Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { NoteEditorBody, useNoteEditor } from '@/components/notes/note-editor';
import { Text } from '@/components/ui/text';
import { useNoteDetail } from '@/features/notes/note.hooks';

function NoteBody({ bodyHtml }: { bodyHtml: string }) {
  const editor = useNoteEditor({ initialContent: bodyHtml, editable: false });
  return (
    <View style={{ flex: 1 }}>
      <NoteEditorBody editor={editor} />
    </View>
  );
}

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { entry, note, labels } = useNoteDetail(id);

  if (!entry || !note) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Note' }} />
        <View className="flex-1 items-center justify-center bg-background p-6">
          <Text className="text-dim text-center">This note could not be found.</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: entry.title }} />
      <View className="flex-1 bg-background">
        {labels.length > 0 ? (
          <View className="flex-row flex-wrap gap-2 px-4 pt-4">
            {labels.map((label) => (
              <View key={label.id} className="bg-elevated rounded-full px-2 py-0.5">
                <Text className="text-dim text-xs">{label.name}</Text>
              </View>
            ))}
          </View>
        ) : null}
        <NoteBody bodyHtml={note.bodyHtml} />
      </View>
    </>
  );
}
