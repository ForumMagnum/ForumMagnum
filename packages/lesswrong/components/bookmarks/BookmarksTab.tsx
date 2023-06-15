import React from 'react';
import { isEAForum } from '../../lib/instanceSettings';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useContinueReading } from '../recommendations/withContinueReading';

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  }
});

export const BookmarksTab = ({classes}: {
  classes: ClassesType,
}) => {
  const {SectionTitle, BookmarksList, ContinueReadingList} = Components
  const {continueReading} = useContinueReading();

  return (<>
      <BookmarksList/>
      <SectionTitle title="Continue Reading"/>
      <ContinueReadingList continueReading={continueReading}/>
    </>);

}

const BookmarksTabComponent = registerComponent('BookmarksTab', BookmarksTab, {styles});

declare global {
  interface ComponentTypes {
    BookmarksTab: typeof BookmarksTabComponent
  }
}

