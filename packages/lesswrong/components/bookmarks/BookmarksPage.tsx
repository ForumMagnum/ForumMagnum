import { registerComponent, Components } from '../../lib/vulcan-lib';
import React, { useEffect, useState } from 'react';
import withErrorBoundary from '../common/withErrorBoundary';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import {useCurrentUser} from "../common/withUser"
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { isFriendlyUI, preferredHeadingCase } from '../../themes/forumTheme';
import { useLocation } from '../../lib/routeUtil';
import { useNavigate } from '../../lib/reactRouterWrapper';

type TabType = 'bookmarks' | 'readhistory' | 'votehistory';

const styles = (theme: ThemeType): JssStyles => ({
  headline: {
    color: theme.palette.grey[1000],
    fontSize: isFriendlyUI ? 28 : undefined,
    fontFamily: isFriendlyUI ? undefined : theme.palette.fonts.serifStack,
    marginTop: isFriendlyUI ? 10 : 0,
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
    fontWeight: isFriendlyUI ? '700' : undefined,
    [theme.breakpoints.down('xs')]: {
      fontSize: 13,
    }
  }
});

const BookmarksPage = ({ classes }: {
  classes: ClassesType
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
    return <Components.ErrorAccessDenied />
  }
  
  const {SingleColumnSection, Typography, BookmarksTab, ReadHistoryTab, VoteHistoryTab} = Components

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
        <Tab className={classes.tab} value='bookmarks' label={isFriendlyUI ? 'Saved' : 'Bookmarks'} />
        <Tab className={classes.tab} value='readhistory' label='Read History' />
        <Tab className={classes.tab} value='votehistory' label='Vote History' />
      </Tabs>
      {activeTab === 'bookmarks' && <BookmarksTab />}
      {activeTab === 'readhistory' && <ReadHistoryTab />}
      {activeTab === 'votehistory' && <VoteHistoryTab />}
    </SingleColumnSection>
  </AnalyticsContext>
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
