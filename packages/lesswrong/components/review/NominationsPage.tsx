import React from 'react';
import { useLocation, useNavigate } from '../../lib/routeUtil';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import {AnalyticsContext} from '@/lib/analyticsEvents'
import {preferredHeadingCase} from '@/themes/forumTheme'
import withErrorBoundary from '@/components/common/withErrorBoundary'
import moment from 'moment'
import qs from 'qs'
import { eligibleToNominate, ReviewYear } from '@/lib/reviewUtils';

const styles = (theme: ThemeType) => ({
  headline: {
    color: theme.palette.grey[1000],
    marginBottom: 40,
    ...theme.typography.headerStyle,
    [theme.breakpoints.down('sm')]: {
      marginTop: 20,
      marginBottom: 10,
    }
  },
  tabsContainer: {
    paddingTop: 20,
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
  },
  content: {
    backgroundColor: theme.palette.background.translucentBackground,
    marginTop: -24,
    paddingTop: 24,
  },
  tab: {
    fontSize: 14,
    //override default tab minWidth
    minWidth: 140,
    [theme.breakpoints.down('xs')]: {
      fontSize: 13,
    }
  },
  title: {
    paddingTop: 16,
    padding: 24,
    width: '100%',
    textAlign: 'center'
  },
  allPosts: {
    backgroundColor: theme.palette.background.translucentBackground,
    '& .SectionTitle-children': {
      position: 'relative',
      left: -36
    },
    '& .SectionTitle-root, .PostsTimeBlock-root > a, .PostsTimeBlock-frontpageSubtitle': {
      position: 'relative',
      left: 12
    }
  },
  externalPostImporter: {
    paddingTop: 24,
    backgroundColor: theme.palette.background.pageActiveAreaBackground
  }
});


const dateStr = (startDate?: Date) =>
  startDate ? moment(startDate).format('YYYY-MM-DD') : ''

const NominationsPage = ({classes, reviewYear}: { classes: ClassesType<typeof styles>, reviewYear: ReviewYear }) => {
  const currentUser = useCurrentUser()
  const navigate = useNavigate()
  const {location, query} = useLocation()
  
  const {
    SectionTitle,
    SingleColumnSection,
    PostsByVoteWrapper,
    ReadHistoryTab,
    PostsListUserCommentedOn,
    Typography,
    LWTooltip,
    AllPostsPage,
    ExternalPostImporter,
  } = Components

  if (!eligibleToNominate(currentUser)) {
    return <SingleColumnSection>
      <Typography variant="body2">
        You are not eligible to nominate posts for this year.
      </Typography>
    </SingleColumnSection>
  }

  const startDate = new Date(reviewYear, 0, 1)
  const endDate = new Date(reviewYear + 1, 0, 1)

  const handleChangeTab = (e: React.ChangeEvent, value: string) => {
    const allPostsParams = {after: dateStr(startDate), before: dateStr(endDate), timeframe: 'yearly'}
    const newQuery = {
      tab: value,
      ...(value === 'all' && allPostsParams),
      ...(value === 'submitlinkposts' && {...allPostsParams, filter: 'linkpost', sortBy: 'new'}),
    }

    navigate({
      ...location,
      search: `?${qs.stringify(newQuery)}`,
    })
  }

  const activeTab = query.tab || 'votes'

  return <AnalyticsContext pageContext="nominationPage">
    <SingleColumnSection>
      <div className={classes.tabsContainer}> 
        <Tabs
          value={activeTab}
          onChange={handleChangeTab}
        >
          <Tab 
            className={classes.tab} 
            value="votes" 
            label={
            <LWTooltip title={`Posts from ${reviewYear} you've upvoted`}>Voted On</LWTooltip>}
          />
          <Tab
            className={classes.tab}
            value="comments"
            label={<LWTooltip title={`Posts from ${reviewYear} you've commented on`}>Commented On</LWTooltip>}
          />
          <Tab
            className={classes.tab}
            value="read"
            label={<LWTooltip title={`Posts from ${reviewYear} you've read`}>Read</LWTooltip>}
          />
          <Tab
            className={classes.tab}
            value="all"
            label={<LWTooltip title={`All posts from ${reviewYear}`}>All Posts</LWTooltip>}
          />
          <Tab
            className={classes.tab}
            value="submitlinkposts"
            label={<LWTooltip title={`Posts from other sites that are relevant to LessWrong or Alignment Forum`}>Submit LinkPosts</LWTooltip>}
          />

        </Tabs>
      </div>
      <div className={classes.content}>
        {(activeTab === 'votes') && <>
          <SectionTitle title={`Your Strong Upvotes for posts from ${reviewYear}`} titleClassName={classes.title}/>
          <PostsByVoteWrapper voteType="bigUpvote" year={reviewYear}/>
          <SectionTitle title={`Your Upvotes for posts from ${reviewYear}`} titleClassName={classes.title}/>
          <PostsByVoteWrapper voteType="smallUpvote" year={reviewYear}/>
        </>}

        {activeTab === 'comments' && <>
          <SectionTitle title={`Posts from ${reviewYear} you've commented on`} titleClassName={classes.title}/>
          <PostsListUserCommentedOn filter={{startDate, endDate, showEvents: false}} sort={{karma: true}}/>
        </>}

        {activeTab === 'read' && <>
          <SectionTitle title={`Posts from ${reviewYear} you've read`} titleClassName={classes.title}/>
          <ReadHistoryTab groupByDate={false} filter={{startDate, endDate, showEvents: false}} sort={{karma: true}}/>
        </>}
      </div>
        {activeTab === 'all' && <div className={classes.allPosts}>
          <AllPostsPage defaultHideSettings/>
        </div>}

        {activeTab === 'submitlinkposts' && <div className={classes.externalPostImporter}>
          <ExternalPostImporter defaultPostedAt={startDate} />
        </div>}
    </SingleColumnSection>
  </AnalyticsContext>
}

const NominationsPageComponent = registerComponent("NominationsPage", NominationsPage, {
  hocs: [withErrorBoundary],
  styles
});

declare global {
  interface ComponentTypes {
    NominationsPage: typeof NominationsPageComponent
  }
}
