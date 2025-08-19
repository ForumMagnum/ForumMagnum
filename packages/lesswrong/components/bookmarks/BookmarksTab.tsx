import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { isFriendlyUI } from '@/themes/forumTheme';
import { useContinueReading } from '../recommendations/withContinueReading';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import SectionTitle from "../common/SectionTitle";
import BookmarksList from "./BookmarksList";
import ContinueReadingList from "../recommendations/ContinueReadingList";
import BookmarksFeed from "./BookmarksFeed";
import FriendlyBookmarksFeed from './FriendlyBookmarksFeed';

export const BookmarksTab = () => {
  const {continueReading} = useContinueReading()

  return <AnalyticsContext pageSectionContext="bookmarksTab">

    {continueReading?.length > 0 && <>
      <SectionTitle title="Continue Reading"/>
      <ContinueReadingList continueReading={continueReading}/>
    </>}

    <SectionTitle title="Saved Posts"/>
    <BookmarksList showMessageIfEmpty={true} />
    {isFriendlyUI ? <FriendlyBookmarksFeed /> : <BookmarksFeed />}

  </AnalyticsContext>
}

export default registerComponent('BookmarksTab', BookmarksTab);
