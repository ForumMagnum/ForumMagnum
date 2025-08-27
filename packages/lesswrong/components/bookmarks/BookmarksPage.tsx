"use client";

import { registerComponent } from '../../lib/vulcan-lib/components';
import React, { useEffect, useState } from 'react';
import withErrorBoundary from '../common/withErrorBoundary';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import {useCurrentUser} from "../common/withUser"
import Tabs from '@/lib/vendor/@material-ui/core/src/Tabs';
import Tab from '@/lib/vendor/@material-ui/core/src/Tab';
import { isFriendlyUI, preferredHeadingCase } from '../../themes/forumTheme';
import { useLocation, useNavigate } from "../../lib/routeUtil";
import ErrorAccessDenied from "../common/ErrorAccessDenied";
import SingleColumnSection from "../common/SingleColumnSection";
import { Typography } from "../common/Typography";
import BookmarksTab from "./BookmarksTab";
import ReadHistoryTab from "./ReadHistoryTab";
import VoteHistoryTab from "./VoteHistoryTab";

type TabType = 'bookmarks' | 'readhistory' | 'votehistory';

const styles = (theme: ThemeType) => ({
  headline: {
    color: theme.palette.grey[1000],
    fontSize: theme.isFriendlyUI ? 28 : undefined,
    fontFamily: theme.isFriendlyUI ? undefined : theme.palette.fonts.serifStack,
    marginTop: theme.isFriendlyUI ? 10 : 0,
    marginBottom: 20,
    [theme.breakpoints.down('sm')]: {
      marginTop: 20,
      marginBottom: 10,
    }
  },
  tabs: {
    marginBottom: 20,
  },
  tab: {
    fontSize: 14,
    fontWeight: theme.isFriendlyUI ? '700' : undefined,
    [theme.breakpoints.down('xs')]: {
      fontSize: 13,
    }
  }
});

const BookmarksPage = ({ classes }: {
  classes: ClassesType<typeof styles>
}) => {
  const navigate = useNavigate();
  const { location } = useLocation()
  const [activeTab, setActiveTab] = useState<TabType>('bookmarks')
  
  useEffect(() => {
    // unfortunately the hash is unavailable on the server, so we check it here instead
    if (location.hash === '#readhistory') {
      setActiveTab('readhistory')
    } else if (location.hash === '#votehistory') {
      setActiveTab('votehistory')
    }
  }, [location.hash])
  
  const handleChangeTab = (e: React.ChangeEvent, value: TabType) => {
    setActiveTab(value)
    navigate({...location, hash: `#${value}`}, {replace: true})
  }

  const currentUser = useCurrentUser()
  if (!currentUser) {
    return <ErrorAccessDenied />
  }
  return <AnalyticsContext pageContext="bookmarksPage" capturePostItemOnMount>
    <SingleColumnSection>
      <Typography variant="display2" className={classes.headline}>
        {preferredHeadingCase(`Saved & Read`)}
      </Typography>
      <Tabs
        value={activeTab}
        onChange={handleChangeTab}
        className={classes.tabs}
      >
        <Tab className={classes.tab} value='bookmarks' label={isFriendlyUI() ? 'Saved' : 'Bookmarks'} />
        <Tab className={classes.tab} value='readhistory' label='Read History' />
        <Tab className={classes.tab} value='votehistory' label='Vote History' />
      </Tabs>
      {activeTab === 'bookmarks' && <BookmarksTab />}
      {activeTab === 'readhistory' && <ReadHistoryTab />}
      {activeTab === 'votehistory' && <VoteHistoryTab />}
    </SingleColumnSection>
  </AnalyticsContext>
}


export default registerComponent('BookmarksPage', BookmarksPage, {
  hocs: [withErrorBoundary],
  styles
});


