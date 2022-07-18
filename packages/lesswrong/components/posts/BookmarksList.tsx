import { registerComponent, Components } from '../../lib/vulcan-lib';
import React from 'react';
import { useCurrentUser } from '../common/withUser';
import { useSingle } from '../../lib/crud/withSingle';
import withErrorBoundary from '../common/withErrorBoundary';

const BookmarksList = ({limit=null}: {
  limit?: number|null
}) => {
  const currentUser = useCurrentUser();
  const { PostsItem2 } = Components
  
  const {document: userWithBookmarks, loading} = useSingle({
    collectionName: "Users",
    fragmentName: "UserBookmarkedPosts",
    documentId: currentUser?._id,
    skip: !currentUser?._id,
  });

  let bookmarkedPosts = userWithBookmarks?.bookmarkedPosts || []
  let truncated = false;
  bookmarkedPosts = [...bookmarkedPosts].reverse();
  if (limit) {
    bookmarkedPosts = bookmarkedPosts.slice(0, limit)
    truncated = true;
  }

  return <div>
    {bookmarkedPosts.map((post: PostsList, i: number) =>
      <PostsItem2
        key={post._id} post={post} bookmark
        showBottomBorder={i < bookmarkedPosts.length-1}
      />
    )}
  </div>
}

const BookmarksListComponent = registerComponent('BookmarksList', BookmarksList, {
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    BookmarksList: typeof BookmarksListComponent
  }
}
