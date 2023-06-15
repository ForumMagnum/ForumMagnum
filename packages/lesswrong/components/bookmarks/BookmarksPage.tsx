import { registerComponent, Components } from '../../lib/vulcan-lib';
import React, { useState } from 'react';
import withErrorBoundary from '../common/withErrorBoundary';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import {useCurrentUser} from "../common/withUser"
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

type TabType = 'bookmarks' | 'readhistory' | 'votehistory';

const styles = (theme: ThemeType): JssStyles => ({
  headline: {
    color: theme.palette.grey[1000],
    marginTop: 0,
    marginBottom: 30
  },
  tabs: {
    marginBottom: 20
  },
  tab: {
    fontSize: 14
    // TODO: forum-gated font weight?
  }
});

const BookmarksPage = ({ classes }: {
  classes: ClassesType
}) => {
  const {SingleColumnSection, Typography, BookmarksTab, ReadHistoryTab, VoteHistoryTab} = Components

  const [activeTab, setActiveTab] = useState<TabType>('bookmarks');

  const currentUser = useCurrentUser()

  if (!currentUser) return <span>You must sign in to view bookmarked posts.</span>

  return <SingleColumnSection>
      <Typography variant="display2" className={classes.headline}>
        Saved & Read Posts
      </Typography>
      <AnalyticsContext listContext={"bookmarksPage"} capturePostItemOnMount>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          className={classes.tabs}
        >
          <Tab className={classes.tab} value='bookmarks' label='Bookmarks' />
          <Tab className={classes.tab} value='readhistory' label='Read History' />
          <Tab className={classes.tab} value='votehistory' label='Vote History' />
        </Tabs>
        {activeTab === 'bookmarks' && <BookmarksTab />}
        {activeTab === 'readhistory' && <ReadHistoryTab />}
        {activeTab === 'votehistory' && <VoteHistoryTab />}
      </AnalyticsContext>
    </SingleColumnSection>
}


const BookmarksPageComponent = registerComponent('BookmarksPage', BookmarksPage, {
  hocs: [withErrorBoundary],
  styles
});

declare global {
  interface ComponentTypes {
    BookmarksPage: typeof BookmarksPageComponent
  }
}
