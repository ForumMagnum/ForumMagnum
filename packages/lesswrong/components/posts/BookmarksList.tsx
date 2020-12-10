import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import React from 'react';
import { useCurrentUser } from '../common/withUser';
import withErrorBoundary from '../common/withErrorBoundary';

const BookmarksList = ({limit=50 }) => {
  const currentUser = useCurrentUser();
  const { PostsItem2, Loading } = Components

  const { document: user, loading } = useSingle({
    collectionName: "Users",
    fragmentName: 'UserBookmarks',
    fetchPolicy: 'cache-then-network' as any, //FIXME
    documentId: currentUser!._id,
  });

  let bookmarkedPosts = user?.bookmarkedPosts || []
  bookmarkedPosts = [...bookmarkedPosts].reverse().slice(0, limit)

  if (loading) return <Loading/>

  return (
    <div>
      {bookmarkedPosts.map((post, i) => <PostsItem2 key={post._id} post={post} bookmark showBottomBorder={i < bookmarkedPosts.length -1}/>)}
    </div>
  )
}

const BookmarksListComponent = registerComponent('BookmarksList', BookmarksList, {
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    BookmarksList: typeof BookmarksListComponent
  }
}
