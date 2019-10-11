import { registerComponent, Components } from 'meteor/vulcan:core';
import React from 'react';
import withErrorBoundary from '../common/withErrorBoundary';

const BookmarksPage = () => {
  const { SingleColumnSection, SectionTitle, BookmarksList} = Components

  return (
    <SingleColumnSection>
      <SectionTitle title="Bookmarks"/>
      <BookmarksList />
    </SingleColumnSection>
  )
}

registerComponent('BookmarksPage', BookmarksPage, withErrorBoundary);
