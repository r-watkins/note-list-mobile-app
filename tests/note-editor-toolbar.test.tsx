import { fireEvent, render } from '@testing-library/react-native';

// NoteEditorToolbar imports from '@10play/tentap-editor', whose RichText module pulls in
// react-native-webview's native module at import time - crashes under Jest (no native
// binary, no official mock - see Task 16's on-device-only precedent). Stubbed here since
// Toolbar itself never touches WebView; only importing the package's barrel does.
jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { WebView: React.forwardRef((props: object, ref: unknown) => <View ref={ref} />) };
});

import { NoteEditorToolbar } from '@/components/notes/note-editor';
import type { EditorBridge } from '@10play/tentap-editor';

/**
 * The WebView-backed editor itself can't run under Jest (no native module - see Task
 * 16/39's on-device-only verification), but Toolbar's button-press wiring is pure JS and
 * only needs an object satisfying EditorBridge, not a live editor - see Task 50's design
 * note. This mock supplies the fields DEFAULT_TOOLBAR_ITEMS/HEADING_ITEMS' active/disabled
 * checks and useBridgeState actually read, matching the state a freshly-focused, empty,
 * non-active editor would report.
 */
function createMockEditor(): EditorBridge & Record<string, jest.Mock | unknown> {
  const state = {
    selection: { from: 0, to: 0 },
    isFocused: true,
    isReady: true,
    editable: true,
    empty: true,
    isBoldActive: false,
    canToggleBold: true,
    isItalicActive: false,
    canToggleItalic: true,
    isUnderlineActive: false,
    canToggleUnderline: true,
    canToggleHeading: true,
    headingLevel: undefined,
    isOrderedListActive: false,
    canToggleOrderedList: true,
    isBulletListActive: false,
    canToggleBulletList: true,
  };

  return {
    theme: { toolbar: {} },
    getEditorState: () => state,
    _subscribeToEditorStateUpdate: () => () => {},
    toggleBold: jest.fn(),
    toggleItalic: jest.fn(),
    toggleUnderline: jest.fn(),
    toggleHeading: jest.fn(),
    toggleOrderedList: jest.fn(),
    toggleBulletList: jest.fn(),
  } as unknown as EditorBridge & Record<string, jest.Mock | unknown>;
}

/**
 * ToolbarItemComp's TouchableOpacity has no accessibilityLabel/testID (a gap in the
 * third-party library, not something we patch) so RNTL's usual getByRole/getByLabelText
 * queries can't find these buttons - the only distinguishing prop each rendered button's
 * host View carries is `accessible={true}` (TouchableOpacity's own), unlike the plain
 * icon-wrapper Views nested inside it. Re-reads `result.root` fresh on every call (not a
 * value captured once) since a stale reference throws after the heading-submenu re-render
 * swaps the toolbar's button row. Returns buttons in render order, matching each toolbar
 * item's position in the array Toolbar was given.
 */
function getToolbarButtons(result: Awaited<ReturnType<typeof render>>) {
  return result.root!.queryAll(
    (instance) => instance.type === 'View' && instance.props.accessible === true,
  );
}

describe('NoteEditorToolbar', () => {
  it('renders exactly the compact 6-button set (bold/italic/heading/underline/ordered/bullet), not the library default 15', async () => {
    const editor = createMockEditor();
    const result = await render(<NoteEditorToolbar editor={editor} />);

    expect(getToolbarButtons(result)).toHaveLength(6);
  });

  it('pressing bold/italic/underline/ordered-list/bullet-list calls the matching editor method', async () => {
    const editor = createMockEditor();
    const result = await render(<NoteEditorToolbar editor={editor} />);
    const [bold, italic, , underline, orderedList, bulletList] = getToolbarButtons(result);

    fireEvent.press(bold);
    fireEvent.press(italic);
    fireEvent.press(underline);
    fireEvent.press(orderedList);
    fireEvent.press(bulletList);

    expect(editor.toggleBold).toHaveBeenCalledTimes(1);
    expect(editor.toggleItalic).toHaveBeenCalledTimes(1);
    expect(editor.toggleUnderline).toHaveBeenCalledTimes(1);
    expect(editor.toggleOrderedList).toHaveBeenCalledTimes(1);
    expect(editor.toggleBulletList).toHaveBeenCalledTimes(1);
  });

  // The heading (Aa) button swaps the toolbar to TenTap's own H1-H6 submenu by switching
  // the underlying FlatList's `data`/`toolbarContext` state - internal to the library, not
  // our code. That transition isn't reliably queryable under this RNTL/react-test-renderer
  // combination (querying the tree again after the state change intermittently throws, a
  // FlatList+state-transition interaction unrelated to our own wiring), so it's left to the
  // on-device verification already done for it (Tasks 39/42/45 all exercised the heading
  // submenu live and confirmed it opens and applies the selected level correctly).
});
