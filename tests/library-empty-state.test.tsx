import { render, screen } from '@testing-library/react-native';

import { LibraryEmptyState } from '@/components/library/library-empty-state';

describe('LibraryEmptyState', () => {
  it('shows the empty-library message when the library has nothing in it at all', async () => {
    await render(
      <LibraryEmptyState isLibraryEmpty query="" contentType="all" labelActive={false} />,
    );
    expect(screen.getByText('Your library is empty')).toBeOnTheScreen();
  });

  it('shows a query-specific message when a search has no results', async () => {
    await render(
      <LibraryEmptyState
        isLibraryEmpty={false}
        query="zzznope"
        contentType="all"
        labelActive={false}
      />,
    );
    expect(screen.getByText('No results for "zzznope"')).toBeOnTheScreen();
  });

  it('shows a label-specific message when a label filter has no matching notes', async () => {
    await render(
      <LibraryEmptyState isLibraryEmpty={false} query="" contentType="note" labelActive={true} />,
    );
    expect(screen.getByText('No notes with this label')).toBeOnTheScreen();
  });

  it('shows a lists-specific message when the Lists filter has no matches', async () => {
    await render(
      <LibraryEmptyState isLibraryEmpty={false} query="" contentType="list" labelActive={false} />,
    );
    expect(screen.getByText('No lists yet')).toBeOnTheScreen();
  });

  it('shows a notes-specific message when the Notes filter has no matches', async () => {
    await render(
      <LibraryEmptyState isLibraryEmpty={false} query="" contentType="note" labelActive={false} />,
    );
    expect(screen.getByText('No notes yet')).toBeOnTheScreen();
  });

  it('prefers the query message over the content-type message when both apply', async () => {
    await render(
      <LibraryEmptyState
        isLibraryEmpty={false}
        query="zzznope"
        contentType="list"
        labelActive={false}
      />,
    );
    expect(screen.getByText('No results for "zzznope"')).toBeOnTheScreen();
  });
});
