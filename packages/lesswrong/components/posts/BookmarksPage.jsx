import { registerComponent, Components } from 'meteor/vulcan:core';
import React from 'react';
import withErrorBoundary from '../common/withErrorBoundary';
import {AnalyticsContext} from "../../lib/analyticsEvents";

const BookmarksPage = () => {
  const { SingleColumnSection, SectionTitle, BookmarksList} = Components

  return (
    <SingleColumnSection>
        <AnalyticsContext listContext={'bookmarksPage'}>
            <SectionTitle title="Bookmarks"/>
            <BookmarksList />
        </AnalyticsContext>
    </SingleColumnSection>
  )
}

registerComponent('BookmarksPage', BookmarksPage, withErrorBoundary);
