import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useContinueReading } from '../recommendations/withContinueReading';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import SectionTitle from "../common/SectionTitle";
import BookmarksList from "./BookmarksList";
import ContinueReadingList from "../recommendations/ContinueReadingList";
import BookmarksFeed from "./BookmarksFeed";

export const BookmarksTab = () => {
  const {continueReading} = useContinueReading()
  
  return <AnalyticsContext pageSectionContext="bookmarksTab">

    {continueReading?.length > 0 && <>
      <SectionTitle title="Continue Reading"/>
      <ContinueReadingList continueReading={continueReading}/>
    </>}

    <SectionTitle title="Saved Posts"/>
    <BookmarksList showMessageIfEmpty={true} />
    <BookmarksFeed />

  </AnalyticsContext>
}

export default registerComponent('BookmarksTab', BookmarksTab);



