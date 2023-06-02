import React, {useState} from 'react';
import { registerComponent, Components, fragmentTextForQuery } from '../../lib/vulcan-lib';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import {useCurrentUser} from "../common/withUser"
import { gql, useQuery, NetworkStatus } from '@apollo/client';
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
  const defaultLimit = 10;
  const pageSize = 30;
  const [limit,setLimit] = useState(defaultLimit);
  
  // pull the latest 10 posts that the current user has read
  const { data, fetchMore } = useQuery(gql`
    query getReadHistory($limit: Int) {
      UserReadHistory(limit: $limit) {
        posts {
          ...PostsListWithVotes
          lastVisitedAt
        }
      }
    }
    ${fragmentTextForQuery("PostsListWithVotes")}
    `,
    {
      ssr: true,
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-only",
      skip: !currentUser,
      variables: {limit: defaultLimit},
    }
  )
  
  const {SingleColumnSection, SectionTitle, Loading, PostsItem, Typography, LoadMore} = Components

  if (!currentUser) {
    return <SingleColumnSection>
      You must sign in to view your read history.
    </SingleColumnSection>
  }
  
  const readHistory: (PostsListWithVotes&{lastVisitedAt:Date})[] = data?.UserReadHistory?.posts
  
  let bodyNode = <Loading />
  if (readHistory) {
    // group the posts by last read "Today", "Yesterday", and "Older"
    const todaysPosts = readHistory.filter(item => moment(item.lastVisitedAt).isSame(moment(), 'day'))
    const yesterdaysPosts = readHistory.filter(item => moment(item.lastVisitedAt).isSame(moment().subtract(1, 'day'), 'day'))
    const olderPosts = readHistory.filter(item => moment(item.lastVisitedAt).isBefore(moment().subtract(1, 'day'), 'day'))
    
    bodyNode = <>
      {!!todaysPosts.length && <SectionTitle title="Today"/>}
      {todaysPosts?.map(item => <PostsItem key={item._id} post={item}/>)}
      {!!yesterdaysPosts.length && <SectionTitle title="Yesterday"/>}
      {yesterdaysPosts?.map(item => <PostsItem key={item._id} post={item}/>)}
      {!!olderPosts.length && <SectionTitle title="Older"/>}
      {olderPosts?.map(item => <PostsItem key={item._id} post={item}/>)}
      <LoadMore
        loadMore={() => {
          const newLimit = limit + pageSize;
          void fetchMore({
            variables: {
              limit: newLimit
            },
            updateQuery: (prev, { fetchMoreResult }) => {
              if (!fetchMoreResult) return prev;
              return fetchMoreResult
            }
          })
          setLimit(newLimit);
        }}
      />
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
