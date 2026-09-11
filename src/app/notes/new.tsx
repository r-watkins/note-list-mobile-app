import { Stack, useNavigation, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, View } from 'react-native';

import { NoteEditorBody, NoteEditorToolbar, useNoteEditor } from '@/components/notes/note-editor';
import { NoteLabelPicker } from '@/components/notes/note-label-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { createNote } from '@/features/notes/note.service';
import { runWrite } from '@/lib/errors';

/**
 * Create a new note: title + rich-text body, explicit Save action (spec §11.3 - no
 * autosave in MVP), and a discard-confirmation if the user tries to leave with unsaved
 * changes. `isDirtyRef` (not just `isDirty` state) is what the beforeRemove listener reads,
 * and handleSave sets it to `false` imperatively right before navigating away on a
 * successful save - a state update alone wouldn't be guaranteed to re-render and
 * resubscribe the listener before router.replace's own beforeRemove event fires in the
 * same tick, which would incorrectly show "discard?" right after an intentional save.
 */
export default function NewNoteScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [bodyDirty, setBodyDirty] = useState(false);
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const editor = useNoteEditor({ onChange: () => setBodyDirty(true) });

  const isDirty = title.trim().length > 0 || bodyDirty || labelIds.length > 0;
  const isDirtyRef = useRef(isDirty);
  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(
    () =>
      navigation.addListener('beforeRemove', (e) => {
        if (!isDirtyRef.current) {
          return;
        }
        e.preventDefault();
        Alert.alert(
          'Discard note?',
          'You have unsaved changes. Are you sure you want to discard them?',
          [
            { text: 'Keep editing', style: 'cancel' },
            {
              text: 'Discard',
              style: 'destructive',
              onPress: () => navigation.dispatch(e.data.action),
            },
          ],
        );
      }),
    [navigation],
  );

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      return;
    }
    const bodyHtml = await editor.getHTML();
    const result = runWrite(() => createNote({ title: trimmedTitle, bodyHtml, labelIds }));
    if (result.ok) {
      isDirtyRef.current = false;
      router.replace({ pathname: '/notes/[id]', params: { id: result.value } });
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'New note' }} />
      <View className="flex-1 bg-background">
        <View className="gap-3 p-4">
          <Input
            value={title}
            onChangeText={setTitle}
            placeholder="Note title"
            autoFocus
            returnKeyType="done"
          />
          <Button onPress={handleSave} disabled={title.trim().length === 0}>
            <Text>Save</Text>
          </Button>
        </View>
        <NoteLabelPicker selectedLabelIds={labelIds} onChange={setLabelIds} />
        <View className="flex-1">
          <NoteEditorBody editor={editor} />
        </View>
        <NoteEditorToolbar editor={editor} />
      </View>
    </>
  );
}
