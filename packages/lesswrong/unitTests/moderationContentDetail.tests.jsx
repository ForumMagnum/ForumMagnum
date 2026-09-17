/** @jest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ModerationContentDetail from '@/components/sunshineDashboard/supermod/ModerationContentDetail';

jest.mock('@/components/hooks/useStyles', () => ({ defineStyles: jest.fn(), useStyles: () => ({}) }));
jest.mock('@/components/comments/CommentsNode', () => ({
  __esModule: true,
  default: ({ treeOptions }) => <div>
    <span data-testid="post-context">{treeOptions.post?._id}</span>
    <span data-testid="tag-context">{treeOptions.tag?._id}</span>
  </div>,
}));
jest.mock('@/components/common/ForumIcon', () => ({ __esModule: true, default: () => null }));
jest.mock('@/lib/reactRouterWrapper', () => ({ Link: ({ children }) => children }));
jest.mock('@/lib/collections/posts/helpers', () => ({ postGetPageUrl: jest.fn() }));
jest.mock('@/components/posts/PostsPage/PostBodyPrefix', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/common/ContentStyles', () => ({ __esModule: true, default: ({ children }) => children }));
jest.mock('@/components/contents/ContentItemBody', () => ({ ContentItemBody: () => null }));
jest.mock('@/components/dropdowns/posts/PostActionsButton', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/sunshineDashboard/supermod/ModerationMapPin', () => ({ ModerationMapPinDetail: () => null }));

describe('moderation comment context', () => {
  it('provides the post needed by comment moderation actions', () => {
    render(<ModerationContentDetail item={{
      _id: 'comment', title: null, postId: 'post', post: { _id: 'post' }, tag: null,
    }} />);

    expect(screen.getByTestId('post-context')).toHaveTextContent('post');
    expect(screen.getByTestId('tag-context')).toBeEmptyDOMElement();
  });

  it('provides the tag needed by comment moderation actions', () => {
    render(<ModerationContentDetail item={{
      _id: 'comment', title: null, tagId: 'tag', post: null, tag: { _id: 'tag' },
    }} />);

    expect(screen.getByTestId('tag-context')).toHaveTextContent('tag');
    expect(screen.getByTestId('post-context')).toBeEmptyDOMElement();
  });
});
