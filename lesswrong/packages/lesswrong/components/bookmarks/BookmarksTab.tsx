import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useContinueReading } from '../recommendations/withContinueReading';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import { SectionTitle } from "@/components/common/SectionTitle";
import BookmarksList from "@/components/bookmarks/BookmarksList";
import ContinueReadingList from "@/components/recommendations/ContinueReadingList";

export const BookmarksTab = () => {
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

export default BookmarksTabComponent;

