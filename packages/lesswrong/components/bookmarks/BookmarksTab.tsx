import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useContinueReading } from '../recommendations/withContinueReading';
import { AnalyticsContext } from '../../lib/analyticsEvents';

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  }
});

export const BookmarksTab = ({classes}: {
  classes: ClassesType,
}) => {
  const {SectionTitle, BookmarksList, ContinueReadingList} = Components
  const {continueReading} = useContinueReading();

  return <AnalyticsContext pageSectionContext="bookmarksTab">
    <BookmarksList/>
    <SectionTitle title="Continue Reading"/>
    <ContinueReadingList continueReading={continueReading}/>
  </AnalyticsContext>

}

const BookmarksTabComponent = registerComponent('BookmarksTab', BookmarksTab, {styles});

declare global {
  interface ComponentTypes {
    BookmarksTab: typeof BookmarksTabComponent
  }
}

