import React, {useState} from 'react';
import { registerComponent, Components, fragmentTextForQuery } from '../../lib/vulcan-lib';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import {useCurrentUser} from "../common/withUser"
import { gql, useQuery, NetworkStatus } from '@apollo/client';
import moment from 'moment';

const styles = (theme: ThemeType): JssStyles => ({
  empty: {
    color: theme.palette.grey[600],
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontWeight: 500,
    fontSize: 14,
    lineHeight: "1.6em",
    marginBottom: 40,
  },
  loadMore: {
    marginTop: 10
  },
  loadMoreSpinner: {
    textAlign: 'left',
    paddingTop: 6,
    paddingLeft: 10,
    margin: 0
  }
})

const ReadHistoryTab = ({classes}: {classes: ClassesType}) => {
  const currentUser = useCurrentUser()
  const defaultLimit = 10;
  const pageSize = 30;
  const [limit, setLimit] = useState(defaultLimit);
  
  // pull the latest 10 posts that the current user has read
  const { data, loading, fetchMore, networkStatus } = useQuery(gql`
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
      notifyOnNetworkStatusChange: true
    }
  )
  
  const {SectionTitle, Loading, PostsItem, LoadMore} = Components
  
  const readHistory: (PostsListWithVotes & {lastVisitedAt: Date})[] = data?.UserReadHistory?.posts
  
  if (loading && networkStatus !== NetworkStatus.fetchMore) {
    return <Loading />
  }
  if (!readHistory) {
    return null;
  }
  if (!readHistory.length) {
    return <div className={classes.empty}>{"You haven't read any posts yet."}</div>
  }
  
  // group the posts by last read "Today", "Yesterday", and "Older"
  const todaysPosts = readHistory.filter(post => moment(post.lastVisitedAt).isSame(moment(), 'day'))
  const yesterdaysPosts = readHistory.filter(post => moment(post.lastVisitedAt).isSame(moment().subtract(1, 'day'), 'day'))
  const olderPosts = readHistory.filter(post => moment(post.lastVisitedAt).isBefore(moment().subtract(1, 'day'), 'day'))
  
  return <AnalyticsContext pageSectionContext="bookmarksTab">
    {!!todaysPosts.length && <SectionTitle title="Today"/>}
    {todaysPosts?.map(post => <PostsItem key={post._id} post={post}/>)}
    {!!yesterdaysPosts.length && <SectionTitle title="Yesterday"/>}
    {yesterdaysPosts?.map(post => <PostsItem key={post._id} post={post}/>)}
    {!!olderPosts.length && <SectionTitle title="Older"/>}
    {olderPosts?.map(post => <PostsItem key={post._id} post={post}/>)}
    {!!readHistory.length && <div className={classes.loadMore}>
      <LoadMore
        loading={networkStatus === NetworkStatus.fetchMore}
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
        loadingClassName={classes.loadMoreSpinner}
      />
    </div>}
  </AnalyticsContext>
}


const ReadHistoryTabComponent = registerComponent('ReadHistoryTab', ReadHistoryTab, {styles})

declare global {
  interface ComponentTypes {
    ReadHistoryTab: typeof ReadHistoryTabComponent
  }
}
