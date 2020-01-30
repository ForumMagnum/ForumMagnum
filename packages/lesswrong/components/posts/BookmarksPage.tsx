import { registerComponent, Components } from 'meteor/vulcan:core';
import React from 'react';
import withErrorBoundary from '../common/withErrorBoundary';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import {useCurrentUser} from "../common/withUser"

const BookmarksPage = () => {
  const {SingleColumnSection, SectionTitle, BookmarksList} = Components

  const currentUser = useCurrentUser()

  if (!currentUser) return <span>You must sign in to view bookmarked posts.</span>

  return <SingleColumnSection>
      <AnalyticsContext listContext={"bookmarksPage"} capturePostItemOnMount>
        <SectionTitle title="Bookmarks"/>
        <BookmarksList/>
      </AnalyticsContext>
    </SingleColumnSection>
}


const BookmarksPageComponent = registerComponent('BookmarksPage', BookmarksPage, withErrorBoundary);

declare global {
  interface ComponentTypes {
    BookmarksPage: typeof BookmarksPageComponent
  }
}
