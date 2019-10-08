import { registerComponent, Components, useSingle } from 'meteor/vulcan:core';
import React from 'react';
import withUser from '../common/withUser';
import Users from 'meteor/vulcan:users';
import withErrorBoundary from '../common/withErrorBoundary';

const BookmarksPage = ({currentUser}) => {
  const { SingleColumnSection, SectionTitle, PostsItem2} = Components

  const { document: user } = useSingle({
    collection: Users,
    queryName: "postLinkPreview",
    fragmentName: 'UserBookmarks',
    fetchPolicy: 'cache-then-network',
    documentId: currentUser._id,
  });
  
  const bookmarkedPosts = user?.bookmarkedPosts?.reverse() || []

  return (
    <SingleColumnSection>
      <SectionTitle title="Bookmarks"/>
      {bookmarkedPosts.map((post) => <PostsItem2 key={post._id} post={post}/>)}
    </SingleColumnSection>
  )
}

registerComponent('BookmarksPage', BookmarksPage, withUser, withErrorBoundary);
