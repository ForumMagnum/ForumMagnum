/**
 * @jest-environment jsdom
 */
import React from 'react';
import { jest as typedJest } from '@jest/globals';
import { render } from '@testing-library/react';
import moment from 'moment-timezone';
import PostsTimeBlock from '@/components/posts/PostsTimeBlock';
import PostsTimeframeList from '@/components/posts/PostsTimeframeList';
import PostsTimeframeListExponential from '@/components/posts/PostsTimeframeListExponential';
import ShortformTimeBlock from '@/components/shortform/ShortformTimeBlock';
import { useQueryWithLoadMore } from '@/components/hooks/useQueryWithLoadMore';

jest.mock('@/components/hooks/useStyles', () => ({ useStyles: () => ({}) }));
jest.mock('@/lib/routeUtil', () => ({ useLocation: () => ({ query: {} }) }));
jest.mock('@/lib/reactRouterWrapper', () => ({ QueryLink: ({ children }: React.PropsWithChildren) => <>{children}</> }));
jest.mock('@/themes/forumTheme', () => ({ isFriendlyUI: () => false }));
jest.mock('@/components/common/withTimezone', () => ({ useTimezone: () => ({ timezone: 'UTC' }) }));
jest.mock('@/lib/utils/timeUtil', () => ({ useCurrentTime: () => new Date('2026-09-19T12:00:00Z') }));
jest.mock('@/components/common/Typography', () => ({ Typography: ({ children }: React.PropsWithChildren) => <>{children}</> }));
jest.mock('@/components/posts/PostsPage/ContentType', () => () => null);
jest.mock('@/components/posts/PostsItem', () => () => null);
jest.mock('@/components/common/LoadMore', () => () => null);
jest.mock('@/components/common/Divider', () => () => null);
jest.mock('@/components/posts/PostsLoading', () => () => null);
jest.mock('@/components/tagging/PostsTagsList', () => () => null);
jest.mock('@/components/tagging/TagEditsTimeBlock', () => () => null);
jest.mock('@/components/shortform/ShortformTimeBlock', () => jest.fn(() => null));
jest.mock('@/components/hooks/useQueryWithLoadMore', () => ({
  useQueryWithLoadMore: jest.fn(() => ({
    data: { posts: { results: [], totalCount: 0 } },
    loading: false,
    loadMoreProps: {},
  })),
}));

const before = moment.utc('2026-09-20');
const after = moment.utc('2026-09-19');
const blockProps: React.ComponentProps<typeof PostsTimeBlock> = {
  terms: { view: 'timeframe', sortedBy: 'new' },
  timeBlockLoadComplete: () => {},
  dateForTitle: after,
  getTitle: () => 'Today',
  before,
  after,
  hideIfEmpty: false,
  isMostRecent: true,
  timeframe: 'daily',
  includeTags: false,
};

function expectSortings(postSort: string, shortformSort: string) {
  const postCalls = typedJest.mocked(useQueryWithLoadMore).mock.calls;
  const shortformCalls = typedJest.mocked(ShortformTimeBlock).mock.calls;
  expect(postCalls.length).toBeGreaterThan(0);
  expect(shortformCalls.length).toBeGreaterThan(0);
  for (const [, options] of postCalls) {
    expect(options.variables.selector).toMatchObject({ timeframe: { sortedBy: postSort } });
  }
  for (const [props] of shortformCalls) {
    expect(props.terms?.sortBy).toBe(shortformSort);
  }
}

beforeEach(() => jest.clearAllMocks());

describe('All Posts Quick Takes sorting', () => {
  it('can keep posts newest-first while changing Quick Takes to top, then back to following posts', () => {
    const { rerender } = render(<PostsTimeBlock {...blockProps} shortformSorting="top" />);
    expectSortings('new', 'top');

    jest.clearAllMocks();
    rerender(<PostsTimeBlock {...blockProps} shortformSorting="posts" />);
    expectSortings('new', 'new');
  });

  it('can keep Quick Takes newest-first while posts are sorted by karma', () => {
    render(<PostsTimeBlock {...blockProps} terms={{ view: 'timeframe', sortedBy: 'top' }} shortformSorting="new" />);
    expectSortings('top', 'new');
  });

  it('preserves the current default of following post sorting', () => {
    render(<PostsTimeBlock {...blockProps} />);
    expectSortings('new', 'new');
  });

  it('keeps the existing top fallback for inflation-adjusted post sorting', () => {
    render(<PostsTimeBlock {...blockProps} terms={{ view: 'timeframe', sortedBy: 'topAdjusted' }} />);
    expectSortings('topAdjusted', 'top');
  });

  it('keeps magic sorting for the current block when following posts', () => {
    render(<PostsTimeBlock {...blockProps} terms={{ view: 'timeframe', sortedBy: 'magic' }} />);
    expectSortings('magic', 'magic');
  });

  it('removes age discounting from older blocks when following posts', () => {
    render(<PostsTimeBlock {...blockProps} terms={{ view: 'timeframe', sortedBy: 'magic' }} isMostRecent={false} />);
    expectSortings('top', 'top');
  });

  it('passes independent sorting through regular time ranges', () => {
    render(<PostsTimeframeList
      before="2026-09-20"
      after="2026-09-18"
      timeframe="daily"
      numTimeBlocks={2}
      postListParameters={{ view: 'timeframe', sortedBy: 'new' }}
      shortform="all"
      shortformSorting="top"
      includeTags={false}
    />);
    expectSortings('new', 'top');
  });

  it('passes independent sorting through expanding time ranges', () => {
    render(<PostsTimeframeListExponential
      postListParameters={{ view: 'timeframe', sortedBy: 'new' }}
      shortformSorting="top"
    />);
    expectSortings('new', 'top');
  });
});
