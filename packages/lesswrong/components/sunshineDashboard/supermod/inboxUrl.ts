interface InboxSearchUpdateArgs {
  currentSearch: string;
  previousOpenedUserId: string | null;
  openedUserId: string | null;
}

export function getInitialOpenedUserId(
  locationUser: string | null | undefined,
  browserSearch?: string,
): string | null {
  if (browserSearch !== undefined) {
    return new URLSearchParams(browserSearch).get('user') || null;
  }

  return locationUser ?? null;
}

export function getInboxSearchUpdate({
  currentSearch,
  previousOpenedUserId,
  openedUserId,
}: InboxSearchUpdateArgs): string | null {
  const searchParams = new URLSearchParams(currentSearch);
  const currentUrlUser = searchParams.get('user');

  if (openedUserId) {
    if (currentUrlUser === openedUserId) {
      return null;
    }

    searchParams.set('user', openedUserId);
    return searchParams.toString();
  }

  if (previousOpenedUserId && currentUrlUser === previousOpenedUserId) {
    searchParams.delete('user');
    return searchParams.toString();
  }

  return null;
}
