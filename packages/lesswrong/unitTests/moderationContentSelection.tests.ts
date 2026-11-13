import { getNextUnapprovedContentIndex, type IndexedRejectableContent } from '@/components/sunshineDashboard/supermod/helpers';

function createContent(
  id: string,
  overrides: Partial<Pick<IndexedRejectableContent, 'rejected' | 'authorIsUnreviewed'>> = {}
): IndexedRejectableContent {
  return {
    _id: id,
    rejected: false,
    authorIsUnreviewed: true,
    ...overrides,
  };
}

describe('getNextUnapprovedContentIndex', () => {
  test('selects the next unapproved item and skips decided content', () => {
    const items = [
      createContent('current'),
      createContent('rejected', { rejected: true }),
      createContent('approved', { authorIsUnreviewed: false }),
      createContent('next'),
    ];

    expect(getNextUnapprovedContentIndex(items, 'current')).toBe(3);
  });

  test('wraps to an earlier unapproved item', () => {
    const items = [
      createContent('next'),
      createContent('approved', { authorIsUnreviewed: false }),
      createContent('current'),
    ];

    expect(getNextUnapprovedContentIndex(items, 'current')).toBe(0);
  });

  test('does not select the rejected item when no other content is unapproved', () => {
    const items = [
      createContent('current'),
      createContent('approved', { authorIsUnreviewed: false }),
    ];

    expect(getNextUnapprovedContentIndex(items, 'current')).toBeNull();
  });
});
