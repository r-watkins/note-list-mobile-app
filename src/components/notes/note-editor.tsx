import {
  DEFAULT_TOOLBAR_ITEMS,
  Images,
  RichText,
  Toolbar,
  useEditorBridge,
  type EditorBridge,
  type ToolbarItem,
} from '@10play/tentap-editor';

import { THEME } from '@/theme/theme';

/**
 * Toolbar buttons restricted to spec §6.2's minimum formatting set (bold, italic,
 * underline, heading, bullet list, numbered list) - DEFAULT_TOOLBAR_ITEMS also
 * includes link/code/blockquote/strike/indent/outdent/undo/redo, which aren't in
 * that set and would be stripped by src/lib/html/sanitize.ts on save.
 */
const COMPACT_TOOLBAR_IMAGES = [
  Images.bold,
  Images.italic,
  Images.underline,
  Images.Aa,
  Images.orderedList,
  Images.bulletList,
];

const COMPACT_TOOLBAR_ITEMS: ToolbarItem[] = DEFAULT_TOOLBAR_ITEMS.filter((item) =>
  COMPACT_TOOLBAR_IMAGES.includes(item.image({} as never)),
);

/**
 * Dark-monochrome toolbar theme (design.md tokens from src/theme/theme.ts), plus the
 * webview surface color. The editor's inner HTML content is themed separately via
 * NOTE_EDITOR_CSS, injected once the WebView loads (RichText.tsx has no theme->CSS
 * bridge of its own - see @10play/tentap-editor's own dark-mode example, which follows
 * the same injectCSS-on-load pattern).
 */
const NOTE_EDITOR_THEME = {
  toolbar: {
    toolbarBody: {
      borderTopColor: THEME.borderStrong,
      borderBottomColor: THEME.borderStrong,
      backgroundColor: THEME.elevated,
    },
    toolbarButton: {
      backgroundColor: THEME.elevated,
    },
    iconWrapper: {
      borderRadius: 8,
      backgroundColor: THEME.elevated,
    },
    iconWrapperActive: {
      backgroundColor: THEME.borderStrong,
    },
    icon: {
      tintColor: THEME.foreground,
    },
    iconDisabled: {
      tintColor: THEME.dimForeground,
    },
  },
  webview: {
    backgroundColor: THEME.elevated,
  },
  webviewContainer: {},
};

const NOTE_EDITOR_CSS = `
  * {
    background-color: ${THEME.elevated};
    color: ${THEME.foreground};
  }
`;

export type { EditorBridge };

export function useNoteEditor(options?: {
  initialContent?: string;
  editable?: boolean;
  onChange?: () => void;
}): EditorBridge {
  return useEditorBridge({
    autofocus: false,
    avoidIosKeyboard: true,
    initialContent: options?.initialContent,
    editable: options?.editable,
    onChange: options?.onChange,
    theme: NOTE_EDITOR_THEME,
  });
}

export function NoteEditorBody({ editor }: { editor: EditorBridge }) {
  return (
    <RichText
      editor={editor}
      onLoad={() => {
        editor.injectCSS(NOTE_EDITOR_CSS, 'note-editor-theme');
      }}
    />
  );
}

export function NoteEditorToolbar({ editor }: { editor: EditorBridge }) {
  return <Toolbar editor={editor} items={COMPACT_TOOLBAR_ITEMS} />;
}
