import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useContinueReading } from '../recommendations/withContinueReading';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import { SectionTitle } from "../common/SectionTitle";
import { BookmarksList } from "./BookmarksList";
import { ContinueReadingList } from "../recommendations/ContinueReadingList";
import { BookmarksFeed } from "./BookmarksFeed";

export const BookmarksTabInner = () => {
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

