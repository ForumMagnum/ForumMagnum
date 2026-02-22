"use client";

import Tab from '@/lib/vendor/@material-ui/core/src/Tab';
import Tabs from '@/lib/vendor/@material-ui/core/src/Tabs';
import React, { useEffect, useState } from 'react';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { useNavigate, useSubscribedLocation } from "../../lib/routeUtil";
import { registerComponent } from '../../lib/vulcan-lib/components';
import { preferredHeadingCase } from '../../themes/forumTheme';
import ErrorAccessDenied from "../common/ErrorAccessDenied";
import SingleColumnSection from "../common/SingleColumnSection";
import { Typography } from "../common/Typography";
import withErrorBoundary from '../common/withErrorBoundary';
import { useCurrentUser } from "../common/withUser";
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';
import BookmarksTab from "./BookmarksTab";
import ReadHistoryTab from "./ReadHistoryTab";
import VoteHistoryTab from "./VoteHistoryTab";

type TabType = 'bookmarks' | 'readhistory' | 'votehistory';

const styles = defineStyles("BookmarksPage", (theme: ThemeType) => ({
  headline: {
    color: theme.palette.grey[1000],
    fontFamily: theme.palette.fonts.serifStack,
    marginTop: 0,
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
    [theme.breakpoints.down('xs')]: {
      fontSize: 13,
    }
  }
}));

const BookmarksPage = () => {
  const classes = useStyles(styles);
  const navigate = useNavigate();
  const { location: {hash} } = useSubscribedLocation()
  const [activeTab, setActiveTab] = useState<TabType>('bookmarks')
  
  useEffect(() => {
    // unfortunately the hash is unavailable on the server, so we check it here instead
    if (hash === '#readhistory') {
      setActiveTab('readhistory')
    } else if (hash === '#votehistory') {
      setActiveTab('votehistory')
    }
  }, [hash])
  
  const handleChangeTab = (e: React.ChangeEvent, value: TabType) => {
    setActiveTab(value)
    navigate({hash: `#${value}`}, {replace: true, scroll: false})
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
        <Tab className={classes.tab} value='bookmarks' label={'Bookmarks'} />
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
});
