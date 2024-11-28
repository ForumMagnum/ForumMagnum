import React, {useState} from 'react'
import {Components, fragmentTextForQuery, registerComponent} from '../../lib/vulcan-lib'
import {AnalyticsContext} from '../../lib/analyticsEvents'
import {useCurrentUser} from '../common/withUser'
import {gql, NetworkStatus, useQuery} from '@apollo/client'
import moment from 'moment'

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

interface FilterReadHistory {
  startDate?: Date
  endDate?: Date
  minKarma?: number
  showEvents?: boolean
}

const useUserReadHistory = ({currentUser, limit, filter, sort}: {
  currentUser: UsersCurrent | null,
  limit: number,
  filter?: FilterReadHistory,
  sort?: {
    karma?: boolean,
  },
}) => {
  const {data, loading, fetchMore, networkStatus} = useQuery(gql`
      query getReadHistory($limit: Int, $filter: UserReadHistoryFilter, $sort: UserReadHistorySort) {
        UserReadHistory(limit: $limit, filter: $filter, sort: $sort) {
          posts {
            ...PostsListWithVotes
            lastVisitedAt
          }
        }
      }
      ${fragmentTextForQuery('PostsListWithVotes')}
    `,
    {
      ssr: true,
      fetchPolicy: 'cache-and-network',
      nextFetchPolicy: 'cache-only',
      skip: !currentUser,
      variables: {
        limit: limit,
        filter: filter,
        sort: sort,
      },
      notifyOnNetworkStatusChange: true,
    },
  )
  return {data, loading, fetchMore, networkStatus}
}

const ReadHistoryTab = ({classes, groupByDate = true, filter, sort}: {
  classes: ClassesType,
  groupByDate?: boolean,
  filter?: FilterReadHistory,
  sort?: {
    karma?: boolean,
  },
}) => {
  const currentUser = useCurrentUser()
  const defaultLimit = 30;
  const pageSize = 30;
  const [limit, setLimit] = useState(defaultLimit);
  
  const {data, loading, fetchMore, networkStatus} = useUserReadHistory({
    currentUser: currentUser,
    limit: defaultLimit,
    filter,
    sort,
  })

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
  
  return <AnalyticsContext pageSectionContext="readHistoryTab">
    {groupByDate ? (
      <>
    {!!todaysPosts.length && <SectionTitle title="Today"/>}
        {todaysPosts.map(post => <PostsItem key={post._id} post={post}/>)}
    {!!yesterdaysPosts.length && <SectionTitle title="Yesterday"/>}
        {yesterdaysPosts.map(post => <PostsItem key={post._id} post={post}/>)}
    {!!olderPosts.length && <SectionTitle title="Older"/>}
        {olderPosts.map(post => <PostsItem key={post._id} post={post}/>)}
      </>
    ) : (
      readHistory.map(post => <PostsItem key={post._id} post={post}/>)
    )}
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
