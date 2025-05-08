import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import { useMulti } from '../../lib/crud/withMulti';
import withErrorBoundary from '../common/withErrorBoundary';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import { isEAForum } from '../../lib/instanceSettings';

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
  const { PostsLoading, PostsItem, LoadMore } = Components
  
  const {results: bookmarks, loading, loadMoreProps} = useMulti({
    collectionName: "Bookmarks",
    terms: {
      view: "myBookmarkedPosts",
      limit,
    },
    itemsPerPage: 20,
    fragmentName: "BookmarksWithDocumentFragment",
    fetchPolicy: "cache-and-network",
    skip: !currentUser?._id,
  });
  
  if (!currentUser) return null

  const bookmarkedPosts = bookmarks?.map(bookmark => bookmark.post).filter(p => !!p);
  
  return <AnalyticsContext pageSubSectionContext="bookmarksList">
    <div>
      {showMessageIfEmpty && !loading && !bookmarkedPosts?.length && <div className={classes.empty}>
        {isEAForum
          ? "You haven't saved any posts yet."
          : "You haven't bookmarked any posts yet."
        }
      </div>}
      {loading && !bookmarkedPosts?.length && <PostsLoading placeholderCount={5} />}
      {bookmarkedPosts && bookmarkedPosts.map((post: PostsListWithVotes, i: number) =>
        <PostsItem
          key={post._id} post={post} bookmark
          showBottomBorder={i < bookmarkedPosts.length-1}
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
