// TODO: Import component in components.ts
import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useLocation, useNavigate } from '../../lib/routeUtil';
import { getReviewYearFromString } from '@/lib/reviewUtils';
import { useCurrentUser } from '../common/withUser';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import qs from 'qs'

const styles = (theme: ThemeType) => ({
  root: {

  },
  tabs: {
    marginTop: -4,
    width: '100%',
    '& .MuiTabs-indicator': {
      height: "100%",
      backgroundColor: theme.palette.background.primaryTranslucent
    }
  },
  tab: {
    fontSize: '1.2rem',
    minWidth: 120,
    padding: 16,
    '&$selected': {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.background.pageActiveAreaBackground
    },
  },
  subLabel: {
    marginTop: 4,
    fontSize: '0.8rem',
  },
  selected: {},
});

export const AnnualReviewPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { SingleColumnSection, FrontpageReviewWidget, ReviewVotingPage, NominationsPage } = Components
  const currentUser = useCurrentUser()
  const navigate = useNavigate()
  const { params, query, location } = useLocation()
  const reviewYear = getReviewYearFromString(params.year)

  // Derive activeTab from the current pathname
  const activeTab = location.pathname.includes('reviewVoting') ? 'reviewVoting' : 'nominatePosts'

  const handleChangeTab = (e: React.ChangeEvent<{}>, value: string) => {
    const newPathname = value === 'reviewVoting' ? `/reviewVoting/${reviewYear}` : `/nominatePosts/${reviewYear}`;
    const newQuery = value === 'nominatePosts' ? { ...query, tab: 'submitlinkposts' } : query;

    navigate({
      pathname: newPathname,
      search: `?${qs.stringify(newQuery)}`,
    });
  }
  
  if (!reviewYear) {
    return <SingleColumnSection>
      {params.year} is not a valid review year.
    </SingleColumnSection>
  }

  if (!currentUser) {
    return <SingleColumnSection>
      You must be logged in to view the annual review.
    </SingleColumnSection>
  }

  return <div className={classes.root}>
    <SingleColumnSection>
      <FrontpageReviewWidget showFrontpageItems={false} reviewYear={reviewYear}/>
      <Tabs
        value={activeTab}
        onChange={handleChangeTab}
        fullWidth
        className={classes.tabs}
      >
        <Tab
          label={<div>Find Posts to Nominate<div className={classes.subLabel}><em>Posts You Engaged With • Submit LinkPosts</em></div></div>}
          value="nominatePosts"
          className={classes.tab}
        />
        <Tab
          label="Vote on Nominated Posts"
          value="reviewVoting"
          className={classes.tab}
        />
      </Tabs>
      {activeTab === 'nominatePosts' && <NominationsPage reviewYear={reviewYear}/>}
      {activeTab === 'reviewVoting' && <ReviewVotingPage reviewYear={reviewYear}/>}
    </SingleColumnSection>

  </div>;
}

const AnnualReviewPageComponent = registerComponent('AnnualReviewPage', AnnualReviewPage, {styles});

declare global {
  interface ComponentTypes {
    AnnualReviewPage: typeof AnnualReviewPageComponent
  }
}
