import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useContinueReading } from '../recommendations/withContinueReading';
import { AnalyticsContext } from '../../lib/analyticsEvents';


export const BookmarksTab = () => {
  const {SectionTitle, BookmarksList, ContinueReadingList} = Components
  const {continueReading} = useContinueReading()
  
  return <AnalyticsContext pageSectionContext="bookmarksTab">
    <BookmarksList showMessageIfEmpty={true} />

    {continueReading?.length > 0 && <>
      <SectionTitle title="Continue Reading"/>
      <ContinueReadingList continueReading={continueReading}/>
    </>}
  </AnalyticsContext>
}

const BookmarksTabComponent = registerComponent('BookmarksTab', BookmarksTab);

declare global {
  interface ComponentTypes {
    BookmarksTab: typeof BookmarksTabComponent
  }
}

