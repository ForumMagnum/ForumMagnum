import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import { useMulti } from '../../lib/crud/withMulti';
import withErrorBoundary from '../common/withErrorBoundary';
import sortBy from 'lodash/sortBy';
import findIndex from 'lodash/findIndex';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import { isEAForum } from '../../lib/instanceSettings';
import PostsLoading from "@/components/posts/PostsLoading";
import PostsItem from "@/components/posts/PostsItem";
import LoadMore from "@/components/common/LoadMore";

const styles = (theme: ThemeType) => ({
  empty: {
    color: theme.palette.grey[600],
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontWeight: 500,
    fontSize: 14,
    lineHeight: "1.6em",
    marginBottom: 40,
  },
});

const BookmarksList = ({showMessageIfEmpty=false, limit=20, hideLoadMore=false, classes}: {
  showMessageIfEmpty?: boolean,
  limit?: number,
  hideLoadMore?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const {results: bookmarkedPosts, loading, loadMoreProps} = useMulti({
    collectionName: "Posts",
    terms: {
      view: "myBookmarkedPosts",
      limit,
    },
    itemsPerPage: 20,
    fragmentName: "PostsListWithVotes",
    fetchPolicy: "cache-and-network",
    skip: !currentUser?._id,
  });
  
  if (!currentUser) return null
  
  // HACK: The results have limit/pagination which correctly reflects the order
  // of currentUser.bookmarkedPostsMetadata, but within the limited result set
  // the posts themselves may be out of order. Sort them. See also comments in
  // the myBookmarkedPosts view.
  const sortedBookmarkedPosts = sortBy(bookmarkedPosts,
    post => -findIndex(
      currentUser.bookmarkedPostsMetadata||[],
      (bookmark)=>bookmark.postId === post._id
    )
  );

  return <AnalyticsContext pageSubSectionContext="bookmarksList">
    <div>
      {showMessageIfEmpty && !loading && !sortedBookmarkedPosts.length && <div className={classes.empty}>
        {isEAForum
          ? "You haven't saved any posts yet."
          : "You haven't bookmarked any posts yet."
        }
      </div>}
      {loading && !sortedBookmarkedPosts.length && <PostsLoading placeholderCount={Math.min(currentUser.bookmarkedPostsMetadata.length, limit)} />}
      {sortedBookmarkedPosts && sortedBookmarkedPosts.map((post: PostsListWithVotes, i: number) =>
        <PostsItem
          key={post._id} post={post} bookmark
          showBottomBorder={i < sortedBookmarkedPosts.length-1}
        />
      )}
      {!hideLoadMore && <LoadMore {...loadMoreProps} />}
    </div>
  </AnalyticsContext>
}

const BookmarksListComponent = registerComponent('BookmarksList', BookmarksList, {
  styles,
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    BookmarksList: typeof BookmarksListComponent
  }
}

export default BookmarksListComponent;
