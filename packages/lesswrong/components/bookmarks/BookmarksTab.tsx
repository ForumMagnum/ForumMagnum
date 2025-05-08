import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useContinueReading } from '../recommendations/withContinueReading';
import { AnalyticsContext } from '../../lib/analyticsEvents';


export const BookmarksTabInner = () => {
  const {SectionTitle, BookmarksList, ContinueReadingList, BookmarksFeed} = Components
  const {continueReading} = useContinueReading()
  
  return <AnalyticsContext pageSectionContext="bookmarksTab">

    {continueReading?.length > 0 && <>
      <SectionTitle title="Continue Reading"/>
      <ContinueReadingList continueReading={continueReading}/>
    </>}

    <SectionTitle title="Bookmarked Posts"/>
    <BookmarksList showMessageIfEmpty={true} />
    <BookmarksFeed />

  </AnalyticsContext>
}

export const BookmarksTab = registerComponent('BookmarksTab', BookmarksTabInner);

declare global {
  interface ComponentTypes {
    BookmarksTab: typeof BookmarksTab
  }
}

