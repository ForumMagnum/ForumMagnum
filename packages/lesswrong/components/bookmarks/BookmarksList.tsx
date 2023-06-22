import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { useMulti } from '../../lib/crud/withMulti';
import withErrorBoundary from '../common/withErrorBoundary';
import sortBy from 'lodash/sortBy';
import findIndex from 'lodash/findIndex';
import { AnalyticsContext } from '../../lib/analyticsEvents';

const BookmarksList = ({limit=20, hideLoadMore=false}: {
  limit?: number,
  hideLoadMore?: boolean,
}) => {
  const currentUser = useCurrentUser();
  const { PostsItem, LoadMore } = Components
  
  const {results: bookmarkedPosts, loadMoreProps} = useMulti({
    collectionName: "Posts",
    terms: {
      view: "myBookmarkedPosts",
      limit: limit,
    },
    itemsPerPage: 20,
    fragmentName: "PostsListWithVotes",
    fetchPolicy: "cache-and-network",
    skip: !currentUser?._id,
  });
  
  // HACK: The results have limit/pagination which correctly reflects the order
  // of currentUser.bookmarkedPostsMetadata, but within the limited result set
  // the posts themselves may be out of order. Sort them. See also comments in
  // the myBookmarkedPosts view.
  const sortedBookmarkedPosts = sortBy(bookmarkedPosts,
    post => -findIndex(
      currentUser?.bookmarkedPostsMetadata||[],
      (bookmark)=>bookmark.postId === post._id
    )
  );

  return <AnalyticsContext pageSubSectionContext="bookmarksList">
    <div>
      {sortedBookmarkedPosts && sortedBookmarkedPosts.map((post: PostsListWithVotes, i: number) =>
        <PostsItem
          key={post._id} post={post} bookmark
          showBottomBorder={i < sortedBookmarkedPosts.length-1}
        />
      )}
      {!hideLoadMore && <LoadMore {...loadMoreProps}/>}
    </div>
  </AnalyticsContext>
}

const BookmarksListComponent = registerComponent('BookmarksList', BookmarksList, {
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    BookmarksList: typeof BookmarksListComponent
  }
}
