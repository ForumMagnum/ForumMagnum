import React, {useState} from 'react'
import {AnalyticsContext} from '../../lib/analyticsEvents.tsx'
import {useCurrentUser} from '../common/withUser.tsx'
import {gql, NetworkStatus} from '@apollo/client'
import { useQuery } from '@/lib/crud/useQuery';
import {FilterPostsForReview} from '@/components/bookmarks/ReadHistoryTab.tsx'
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { fragmentTextForQuery } from "../../lib/vulcan-lib/fragments";

const styles = (theme: ThemeType) => ({
  loadMore: {
    marginTop: 10,
  },
  loadMoreSpinner: {
    textAlign: 'left',
    paddingTop: 6,
    paddingLeft: 10,
    margin: 0,
  },
})

const usePostsUserCommentedOn = ({currentUser, limit, filter, sort}: {
  currentUser: UsersCurrent | null,
  limit: number,
  filter?: FilterPostsForReview,
  sort?: {
    karma?: boolean,
  },
}) => {
  const {data, loading, fetchMore, networkStatus} = useQuery(gql`
      query getPostsUserCommentedOn($limit: Int, $filter: PostReviewFilter, $sort: PostReviewSort) {
        PostsUserCommentedOn(limit: $limit, filter: $filter, sort: $sort) {
          posts {
            ...PostsListWithVotes
          }
        }
      }
      ${fragmentTextForQuery('PostsListWithVotes')}
    `,
    {
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

const PostsListUserCommentedOn = ({classes, filter, sort}: {
  classes: ClassesType<typeof styles>,
  filter?: FilterPostsForReview,
  sort?: {
    karma?: boolean,
  },
}) => {
  const currentUser = useCurrentUser()
  const defaultLimit = 30
  const pageSize = 30
  const [limit, setLimit] = useState(defaultLimit)

  const {data, loading, fetchMore, networkStatus} = usePostsUserCommentedOn({
    currentUser: currentUser,
    limit: defaultLimit,
    filter,
    sort,
  })

  const {Loading, PostsItem, LoadMore, Typography} = Components

  const posts = data?.PostsUserCommentedOn?.posts

  if (loading && networkStatus !== NetworkStatus.fetchMore) {
    return <Loading/>
  }
  if (!posts) {
    return null
  }
  if (!posts.length) {
    return <Typography variant="body2">{"You haven't commented on any post in this period."}</Typography>
  }
  
  const maybeMorePosts = !!(posts?.length && (posts.length >= limit))

  return <AnalyticsContext pageSectionContext="postsUserCommentedOnList">
    {posts.map((post: PostsListWithVotes) => <PostsItem key={post._id} post={post}/>)}
    {!!posts.length && <div className={classes.loadMore}>
      <LoadMore
        loading={networkStatus === NetworkStatus.fetchMore}
        loadMore={() => {
          const newLimit = limit + pageSize
          void fetchMore({
            variables: {
              limit: newLimit,
            },
            updateQuery: (prev, {fetchMoreResult}) => fetchMoreResult ?? prev,
          })
          setLimit(newLimit)
        }}
        hidden={!maybeMorePosts}
        loadingClassName={classes.loadMoreSpinner}
      />
    </div>}
  </AnalyticsContext>
}

const PostsListUserCommentedOnComponent = registerComponent('PostsListUserCommentedOn', PostsListUserCommentedOn, {styles})

declare global {
  interface ComponentTypes {
    PostsListUserCommentedOn: typeof PostsListUserCommentedOnComponent
  }
}
