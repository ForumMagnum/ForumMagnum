import { registerComponent, Components, useSingle } from 'meteor/vulcan:core';
import React from 'react';
import withUser from '../common/withUser';
import Users from 'meteor/vulcan:users';
import withErrorBoundary from '../common/withErrorBoundary';
import {AnalyticsContext} from "../../lib/analyticsEvents";

const BookmarksList = ({currentUser, limit=50 }) => {
  const { PostsItem2, Loading } = Components

  const { document: user, loading } = useSingle({
    collection: Users,
    queryName: "postLinkPreview",
    fragmentName: 'UserBookmarks',
    fetchPolicy: 'cache-then-network',
    documentId: currentUser._id,
  });

  let bookmarkedPosts = user?.bookmarkedPosts || []
  bookmarkedPosts = bookmarkedPosts.slice(0, limit)

  if (loading) return <Loading/>

  return (
      <AnalyticsContext listContext={"bookmarks"}>
        <div>
            {bookmarkedPosts.map((post) => <PostsItem2 key={post._id} post={post} bookmark/>)}
        </div>
      </AnalyticsContext>
  )
}

registerComponent('BookmarksList', BookmarksList, withUser, withErrorBoundary);
