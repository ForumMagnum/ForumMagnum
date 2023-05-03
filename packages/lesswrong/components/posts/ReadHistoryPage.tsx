import { registerComponent, Components, fragmentTextForQuery } from '../../lib/vulcan-lib';
import React from 'react';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import {useCurrentUser} from "../common/withUser"
import { gql, useQuery } from '@apollo/client';
import moment from 'moment';

const styles = (theme: ThemeType): JssStyles => ({
  headline: {
    color: theme.palette.grey[1000],
    marginTop: 15
  },
})

type ReadHistoryItem = {
  post: PostsListWithVotes,
  lastRead: Date
}

const ReadHistoryPage = ({classes}: {classes: ClassesType}) => {
  const currentUser = useCurrentUser()
  
  // pull the latest 10 posts that the current user has read
  const { data, loading } = useQuery(gql`
    query getReadHistory {
      UserReadHistory {
        post {
          ...PostsListWithVotes
        }
        lastRead
      }
    }
    ${fragmentTextForQuery("PostsListWithVotes")}
    `,
    {ssr: true, skip: !currentUser}
  )
  
  const {SingleColumnSection, SectionTitle, Loading, PostsItem, Typography} = Components

  if (!currentUser) {
    return <SingleColumnSection>
      You must sign in to view your read history.
    </SingleColumnSection>
  }
  
  const readHistory: ReadHistoryItem[] = data?.UserReadHistory
  
  let bodyNode = <Loading />
  if (!loading && readHistory) {
    // group the posts by last read "Today", "Yesterday", and "Older"
    const todaysPosts = readHistory.filter(item => moment(item.lastRead).isSame(moment(), 'day'))
    const yesterdaysPosts = readHistory.filter(item => moment(item.lastRead).isSame(moment().subtract(1, 'day'), 'day'))
    const olderPosts = readHistory.filter(item => moment(item.lastRead).isBefore(moment().subtract(1, 'day'), 'day'))
    
    bodyNode = <>
      {!!todaysPosts.length && <SectionTitle title="Today"/>}
      {todaysPosts?.map(item => <PostsItem key={item.post._id} post={item.post}/>)}
      {!!yesterdaysPosts.length && <SectionTitle title="Yesterday"/>}
      {yesterdaysPosts?.map(item => <PostsItem key={item.post._id} post={item.post}/>)}
      {!!olderPosts.length && <SectionTitle title="Older"/>}
      {olderPosts?.map(item => <PostsItem key={item.post._id} post={item.post}/>)}
    </>
  }

  return <SingleColumnSection>
      <AnalyticsContext listContext="ReadHistoryPage" capturePostItemOnMount>
        <Typography variant="display2" className={classes.headline}>
          Read history
        </Typography>
        {bodyNode}
      </AnalyticsContext>
    </SingleColumnSection>
}


const ReadHistoryPageComponent = registerComponent('ReadHistoryPage', ReadHistoryPage, {styles})

declare global {
  interface ComponentTypes {
    ReadHistoryPage: typeof ReadHistoryPageComponent
  }
}
