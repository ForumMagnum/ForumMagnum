/** @jest-environment jsdom */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ModerationUserFeed from '@/components/sunshineDashboard/supermod/ModerationUserFeed';

jest.mock('@/components/hooks/useStyles', () => ({
  defineStyles: () => ({}),
  useStyles: () => ({}),
}));
jest.mock('@/components/hooks/useModeratedUserContents', () => ({ MODERATED_USER_CONTENT_LIMIT: 20 }));
jest.mock('@/lib/utils/timeUtil', () => ({ useCurrentTime: () => new Date('2026-10-14') }));
jest.mock('@/lib/crud/useQuery', () => ({
  useQuery: () => ({ data: { posts: { results: [{
    _id: 'coauthored-post',
    title: 'A coauthored post',
    userId: 'other-author',
    postedAt: '2026-10-01',
  }] } } }),
}));
jest.mock('@/components/sunshineDashboard/supermod/ModerationFeedCard', () => ({
  __esModule: true,
  default: function FeedCard({ onFullscreen }: { onFullscreen: () => void }) {
    return <button onClick={onFullscreen}>Open fullscreen</button>;
  },
}));
jest.mock('@/components/sunshineDashboard/supermod/ModerationContentDetail', () => ({
  __esModule: true,
  default: function ContentDetail() { return <div>Fullscreen content</div>; },
}));
jest.mock('@/components/sunshineDashboard/supermod/ModerationMapPin', () => ({
  ModerationMapPinDetail: () => null,
  ModerationMapPinListItem: () => null,
}));

describe('moderation user feed fullscreen', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it.each(['own-post', null])('closes a coauthored post when selection changes from %s', focusedItemId => {
    const props = { user: { _id: 'reviewed-user' }, items: [], runningLlmCheckId: null, dispatch: jest.fn() };
    const { rerender } = render(<ModerationUserFeed {...props} focusedItemId={focusedItemId} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open fullscreen' }));
    expect(screen.getByText('Fullscreen content')).toBeTruthy();
    rerender(<ModerationUserFeed {...props} focusedItemId={focusedItemId} />);
    expect(screen.getByText('Fullscreen content')).toBeTruthy();

    rerender(<ModerationUserFeed {...props} focusedItemId="next-item" />);
    expect(screen.queryByText('Fullscreen content')).toBeNull();
    expect(screen.getByRole('button', { name: 'Open fullscreen' })).toBeTruthy();

    // Returning to the original selection must not reopen the closed post.
    rerender(<ModerationUserFeed {...props} focusedItemId={focusedItemId} />);
    expect(screen.queryByText('Fullscreen content')).toBeNull();
  });
});
