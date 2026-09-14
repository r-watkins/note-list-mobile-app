import { Stack, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, View } from 'react-native';

import { NoteEditorBody, NoteEditorToolbar, useNoteEditor } from '@/components/notes/note-editor';
import { NoteLabelPicker } from '@/components/notes/note-label-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useNoteDetail } from '@/features/notes/note.hooks';
import { updateNote } from '@/features/notes/note.service';
import { runWrite } from '@/lib/errors';
import { hapticDestructiveConfirm } from '@/lib/haptics';

/**
 * The edit form itself - split out from the screen so useNoteEditor's initialContent is
 * only ever seeded once, from data that's already loaded (NoteEditScreen's loading gate
 * below guarantees `entry`/`note` are defined before this mounts). Same discard-warning
 * pattern as notes/new.tsx - see its header comment for why isDirtyRef, not isDirty state,
 * is what the beforeRemove listener reads.
 */
function labelSetsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const bSet = new Set(b);
  return a.every((id) => bSet.has(id));
}

function NoteEditForm({
  entryId,
  initialTitle,
  initialBodyHtml,
  initialLabelIds,
}: {
  entryId: string;
  initialTitle: string;
  initialBodyHtml: string;
  initialLabelIds: string[];
}) {
  const router = useRouter();
  const navigation = useNavigation();
  const [title, setTitle] = useState(initialTitle);
  const [bodyDirty, setBodyDirty] = useState(false);
  const [labelIds, setLabelIds] = useState<string[]>(initialLabelIds);
  const editor = useNoteEditor({
    initialContent: initialBodyHtml,
    onChange: () => setBodyDirty(true),
  });

  const isDirty =
    title.trim() !== initialTitle || bodyDirty || !labelSetsEqual(labelIds, initialLabelIds);
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
          'Discard changes?',
          'You have unsaved changes. Are you sure you want to discard them?',
          [
            { text: 'Keep editing', style: 'cancel' },
            {
              text: 'Discard',
              style: 'destructive',
              onPress: () => {
                hapticDestructiveConfirm();
                navigation.dispatch(e.data.action);
              },
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
    const result = runWrite(() => updateNote(entryId, { title: trimmedTitle, bodyHtml, labelIds }));
    if (result.ok) {
      isDirtyRef.current = false;
      router.replace({ pathname: '/notes/[id]', params: { id: entryId } });
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Edit note' }} />
      <View className="flex-1 bg-background">
        <View className="gap-3 p-4">
          <Input
            value={title}
            onChangeText={setTitle}
            placeholder="Note title"
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

export default function NoteEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { entry, note, labels } = useNoteDetail(id);

  if (!entry || !note) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Edit note' }} />
        <View className="flex-1 items-center justify-center bg-background p-6">
          <Text className="text-dim text-center">This note could not be found.</Text>
        </View>
      </>
    );
  }

  return (
    <NoteEditForm
      entryId={entry.id}
      initialTitle={entry.title}
      initialBodyHtml={note.bodyHtml}
      initialLabelIds={labels.map((label) => label.id)}
    />
  );
}
