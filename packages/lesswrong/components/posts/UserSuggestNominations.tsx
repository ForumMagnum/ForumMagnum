import React from 'react';
import { useLocation, useNavigate } from '../../lib/routeUtil';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import {AnalyticsContext} from '@/lib/analyticsEvents'
import {preferredHeadingCase} from '@/themes/forumTheme'
import withErrorBoundary from '@/components/common/withErrorBoundary'

const styles = (theme: ThemeType): JssStyles => ({
  headline: {
    color: theme.palette.grey[1000],
    marginBottom: 20,
    [theme.breakpoints.down('sm')]: {
      marginTop: 20,
      marginBottom: 10,
    }
  },
  tab: {
    fontSize: 14,
    [theme.breakpoints.down('xs')]: {
      fontSize: 13,
    }
  }
});


const UserSuggestNominations = ({classes}: { classes: ClassesType }) => {
  const currentUser = useCurrentUser()
  const navigate = useNavigate()
  const {params, location, query} = useLocation()
  
  const {
    SectionTitle,
    SingleColumnSection,
    ErrorBoundary,
    PostsByVoteWrapper,
    ReadHistoryTab,
    PostsListUserCommentedOn,
    Typography,
    LWTooltip
  } = Components

  // Handle url-encoded special case, otherwise parseInt year
  const before2020 = '≤2020'
  const year = [before2020, '%e2%89%a42020'].includes(params?.year) ?
    before2020 :
    parseInt(params?.year)
  if (!currentUser) return null

  const startDate = year === before2020 ? undefined : new Date(year, 0, 1)
  const endDate = year === before2020 ? new Date(2020, 0, 1) : new Date(year + 1, 0, 1)

  const handleChangeTab = (e: React.ChangeEvent, value: string) => {
    navigate({
      ...location,
      search: `?tab=${value}`,
    })
  }

  const activeTab = query.tab || 'votes'
  return <AnalyticsContext pageContext="nominationPage">
    <SingleColumnSection>
      <Typography variant="display2" className={classes.headline}>
        {preferredHeadingCase(`Nominate Posts for ${year} review`)}
      </Typography>

      <Tabs
        value={activeTab}
        onChange={handleChangeTab}
      >
        <Tab 
          className={classes.tab} 
          value="votes" 
          label={
          <LWTooltip title={`Posts from ${year} you've upvoted`}>Voted On</LWTooltip>}
        />
        <Tab
          className={classes.tab}
          value="comments"
          label={<LWTooltip title={`Posts from ${year} you've commented on`}>Commented On</LWTooltip>}
        />
        <Tab
          className={classes.tab}
          value="read"
          label={<LWTooltip title={`Posts from ${year} you've read`}>Read</LWTooltip>}
        />
      </Tabs>

      {(activeTab === 'votes') && <>
        <SectionTitle title={`Your Strong Upvotes for posts from ${year}`}/>
        <PostsByVoteWrapper voteType="bigUpvote" year={year}/>
        <SectionTitle title={`Your Upvotes for posts from ${year}`}/>
        <PostsByVoteWrapper voteType="smallUpvote" year={year}/>
      </>}

      {activeTab === 'comments' && <>
        <SectionTitle title={`Posts from ${year} you've commented on`}/>
        <PostsListUserCommentedOn filter={{startDate, endDate, showEvents: false}} sort={{karma: true}}/>
      </>}

      {activeTab === 'read' && <>
        <SectionTitle title={`Posts from ${year} you've read`}/>
        <ReadHistoryTab groupByDate={false} filter={{startDate, endDate, showEvents: false}} sort={{karma: true}}/>
      </>}
    </SingleColumnSection>
  </AnalyticsContext>
}

const UserSuggestNominationsComponent = registerComponent("UserSuggestNominations", UserSuggestNominations, {
  hocs: [withErrorBoundary],
  styles
});

declare global {
  interface ComponentTypes {
    UserSuggestNominations: typeof UserSuggestNominationsComponent
  }
}
