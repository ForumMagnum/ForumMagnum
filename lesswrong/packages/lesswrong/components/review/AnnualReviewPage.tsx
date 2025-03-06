import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useLocation, useNavigate } from '../../lib/routeUtil';
import { getReviewPhase, getReviewYearFromString } from '@/lib/reviewUtils';
import { useCurrentUser } from '../common/withUser';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import qs from 'qs'
import classNames from 'classnames';
import { SECTION_WIDTH } from '../common/SingleColumnSection';
import { allPostsParams } from './NominationsPage';
import SingleColumnSection from "@/components/common/SingleColumnSection";
import FrontpageReviewWidget from "@/components/review/FrontpageReviewWidget";
import ReviewVotingPage from "@/components/review/ReviewVotingPage";
import NominationsPage from "@/components/review/NominationsPage";
import ReviewVotingExpandedPost from "@/components/review/ReviewVotingExpandedPost";
import ReviewsPage from "@/components/review/ReviewsPage";
import ReviewPhaseInformation from "@/components/review/ReviewPhaseInformation";
import QuickReviewPage from "@/components/review/QuickReviewPage";

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
  leftColumn: {
    position: "sticky",
    width: "0%",
    // transition: "width 0.2s ease-in-out",
    top: 72,
    height: "90vh",
    paddingLeft: 24,
    paddingRight: 36,
    overflow: "scroll",
    msOverflowStyle: "none",
    scrollbarWidth: "none",
    "&::-webkit-scrollbar": {
      display: "none"
    },
    [theme.breakpoints.down('sm')]: {
      paddingLeft: 0,
      paddingRight: 0,
      overflow: "unset",
      height: "unset",
      position: "unset"
    }
  },
  expandedPost: {
    width: "100%",
    maxWidth: SECTION_WIDTH,
  },
  rightColumnExpandedPost: {
    opacity: .25
  },
  rightColumn: {
    width: "100%",
    maxWidth: SECTION_WIDTH,
    [theme.breakpoints.down('sm')]: {
      gridArea: "unset"
    },
  },
  tabsContainer: {
    boxShadow: `0px 4px 4px ${theme.palette.greyAlpha(0.1)}`,
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
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginRight: 8,
    marginLeft: 8,
    '&:first-child': {
      marginLeft: 0,
    },
    '&:last-child': {
      marginRight: 0,
    },
    '& .MuiTab-wrapper': {
    },
    color: theme.palette.grey[900],
    backgroundColor: theme.palette.grey[300],
    '&$selected': {
      backgroundColor: theme.palette.background.translucentBackground,
    },
    '&.MuiTab-selected': {
      backgroundColor: theme.palette.background.translucentBackground,
      margin: 0,
      borderRight: `1px solid ${theme.palette.greyAlpha(0.08)}`,
      borderLeft: `1px solid ${theme.palette.greyAlpha(0.08)}`,
      borderTop: `1px solid ${theme.palette.greyAlpha(0.08)}`,
      borderBottom: 'none',
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
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
  const currentUser = useCurrentUser()
  const navigate = useNavigate()
  const { params, query, location } = useLocation()
  const reviewYear = getReviewYearFromString(params.year)

  // Derive activeTab from the current pathname
  let activeTab: 'reviewVoting' | 'nominatePosts' | 'reviews' | 'quickReview' | null = null;
  if (location.pathname.includes('reviewVoting')) {
    activeTab = 'reviewVoting';
  } else if (location.pathname.includes('nominatePosts')) {
    activeTab = 'nominatePosts';
  } else if (location.pathname.includes('reviews')) {
    activeTab = 'reviews';
  } else if (location.pathname.includes('quickReview')) {
    activeTab = 'quickReview';
  }

  const handleChangeTab = (e: React.ChangeEvent<{}>, value: string) => {
    let newPathname = '';
    let newQuery = query;

    if (value === 'reviewVoting') {
      newPathname = `/reviewVoting/${reviewYear}`;
      newQuery = { }
    } else if (value === 'nominatePosts') {
      newPathname = `/nominatePosts/${reviewYear}`;
      newQuery = { ...newQuery, tab: 'all', ...allPostsParams(reviewYear) };
    } else if (value === 'reviews') {
      newPathname = `/reviews/${reviewYear}`;
    } else if (value === 'quickReview') {
      newPathname = `/quickReview/${reviewYear}`;
    }

    navigate({
      pathname: newPathname,
      search: `?${qs.stringify(newQuery)}`,
    });
  }

  const reviewPhase = getReviewPhase(reviewYear)

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
      <div className={classNames(classes.rightColumn, expandedPost && classes.rightColumnExpandedPost)}>
        <FrontpageReviewWidget showFrontpageItems={false} reviewYear={reviewYear}/>
        <ReviewPhaseInformation reviewYear={reviewYear} reviewPhase={reviewPhase}/>
        <Tabs
            value={activeTab}
            onChange={handleChangeTab}
            fullWidth
            className={classes.tabs}
          >
            {reviewPhase === 'REVIEWS' && <Tab
              label="Quick Review"
              value="quickReview"
              className={classes.tab}
            />}
            {reviewPhase === 'NOMINATIONS' && <Tab
              label="Find Posts to Nominate"
              value="nominatePosts"
              className={classes.tab}
            />}
            <Tab
              label={reviewPhase === 'NOMINATIONS' ? "Vote on Nominated Posts" : "Advanced Review"}
              value="reviewVoting"
              className={classes.tab}
            />
            {reviewPhase !== 'NOMINATIONS' && <Tab
              label="Review Leaderboard"
              value="reviews"
              className={classes.tab}
            />}
        </Tabs>
        <div className={classes.tabsContainer}>
          {activeTab === 'nominatePosts' && <NominationsPage reviewYear={reviewYear}/>}
          {activeTab === 'reviewVoting' && <ReviewVotingPage reviewYear={reviewYear} expandedPost={expandedPost} setExpandedPost={setExpandedPost}/>}
          {activeTab === 'reviews' && <ReviewsPage reviewYear={reviewYear} />}
          {activeTab === 'quickReview' && <QuickReviewPage reviewYear={reviewYear} />}
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

export default AnnualReviewPageComponent;
