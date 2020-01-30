import { registerComponent, Components } from 'meteor/vulcan:core';
import { useSingle } from '../../lib/crud/withSingle';
import React from 'react';
import withUser from '../common/withUser';
import Users from 'meteor/vulcan:users';
import withErrorBoundary from '../common/withErrorBoundary';

const BookmarksList = ({currentUser, limit=50 }) => {
  const { PostsItem2, Loading } = Components

  const { document: user, loading } = useSingle({
    collection: Users,
    fragmentName: 'UserBookmarks',
    fetchPolicy: 'cache-then-network' as any, //FIXME
    documentId: currentUser._id,
  });

  let bookmarkedPosts = user?.bookmarkedPosts || []
  bookmarkedPosts = bookmarkedPosts.reverse().slice(0, limit)

  if (loading) return <Loading/>

  return (
    <div>
      {bookmarkedPosts.map((post) => <PostsItem2 key={post._id} post={post} bookmark/>)}
    </div>
  )
}

const BookmarksListComponent = registerComponent('BookmarksList', BookmarksList, withUser, withErrorBoundary);

declare global {
  interface ComponentTypes {
    BookmarksList: typeof BookmarksListComponent
  }
}
