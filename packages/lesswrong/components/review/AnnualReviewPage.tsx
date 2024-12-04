// TODO: Import component in components.ts
import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useLocation, useNavigate } from '../../lib/routeUtil';
import { getReviewYearFromString } from '@/lib/reviewUtils';
import { useCurrentUser } from '../common/withUser';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import qs from 'qs'
import classNames from 'classnames';
import { SECTION_WIDTH } from '../common/SingleColumnSection';

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    justifyContent: "space-around",
    transition: "justify-content 0.2s ease-in-out",
  },
  grid: {
    paddingBottom: 175,
    alignItems: "start",
    [theme.breakpoints.down('sm')]: {
      display: "block"
    }
  },
  noExpandedPost: {
    justifyContent: "center",
  },
  expandedPost: {
    width: "100%",
    maxWidth: SECTION_WIDTH,
  },
  leftColumn: {
    position: "sticky",
    top: 72,
    height: "90vh",
    paddingLeft: 24,
    paddingRight: 36,
    [theme.breakpoints.down('sm')]: {
      paddingLeft: 0,
      paddingRight: 0,
      overflow: "unset",
      height: "unset",
      position: "unset"
    }
  },
  rightColumn: {
    width: "100%",
    maxWidth: SECTION_WIDTH,
    [theme.breakpoints.down('sm')]: {
      gridArea: "unset"
    },
  },
  tabsContainer: {
    width: "100%",
    maxWidth: SECTION_WIDTH,
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    borderRadius: 8,
    paddingTop: 4
  },
  tabs: {
    marginTop: 12,
    width: '100%',
    '& .MuiTabs-indicator': {
      height: "100%",
      backgroundColor: 'unset'
    }
  },
  tab: {
    fontSize: '1rem',
    minWidth: 120,
    padding: 8,
    borderRadius: 8,
    '&:first-child': {
      marginRight: 8,
    },
    '&:last-child': {
      marginLeft: 8,
    },
    marginBottom: -8,
    '& .MuiTab-wrapper': {
    },
    color: theme.palette.grey[900],
    backgroundColor: theme.palette.grey[300],
    '&$selected': {
      backgroundColor: theme.palette.background.pageActiveAreaBackground
    },
    '&.MuiTab-selected': {
      backgroundColor: theme.palette.background.pageActiveAreaBackground,
      margin: 0,
      marginBottom: -8,
    }
  },
  subLabel: {
    marginTop: 4,
    fontSize: '0.8rem',
    opacity: 0.8
  },
  selected: {},
  expandedGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 3fr',
    gap: 16,
  }
});

export const AnnualReviewPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { SingleColumnSection, FrontpageReviewWidget, ReviewVotingPage, NominationsPage, ReviewVotingExpandedPost } = Components
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

  const [expandedPost, setExpandedPost] = useState<PostsReviewVotingList|null>(null)
  
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

  return <div className={classNames(classes.root, expandedPost ? classes.grid : classes.noExpandedPost)}>
      <div className={classNames(classes.leftColumn, expandedPost && classes.expandedPost)}>
        {expandedPost && <ReviewVotingExpandedPost key={expandedPost?._id} post={expandedPost} setExpandedPost={setExpandedPost}/>}
      </div>
      <div className={classes.rightColumn}>
        <FrontpageReviewWidget showFrontpageItems={false} reviewYear={reviewYear}/>
          <Tabs
            value={activeTab}
            onChange={handleChangeTab}
            fullWidth
            className={classes.tabs}
          >
            <Tab
              label="Find Posts to Nominate"
              value="nominatePosts"
              className={classes.tab}
            />
            <Tab
              label="Vote on Nominated Posts"
              value="reviewVoting"
              className={classes.tab}
            />
        </Tabs>
        <div className={classes.tabsContainer}>
          {activeTab === 'nominatePosts' && <NominationsPage reviewYear={reviewYear}/>}
          {activeTab === 'reviewVoting' && <ReviewVotingPage reviewYear={reviewYear} expandedPost={expandedPost} setExpandedPost={setExpandedPost}/>}
        </div>
    </div>
  </div>
}

const AnnualReviewPageComponent = registerComponent('AnnualReviewPage', AnnualReviewPage, {styles});

declare global {
  interface ComponentTypes {
    AnnualReviewPage: typeof AnnualReviewPageComponent
  }
}
