import React, {useState} from 'react';
import { registerComponent, Components, fragmentTextForQuery } from '../../lib/vulcan-lib';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import {useCurrentUser} from "../common/withUser"
import { gql, useQuery, NetworkStatus } from '@apollo/client';
import moment from 'moment';
import type { UserContent } from '../../server/repos/VotesRepo';

const styles = (theme: ThemeType): JssStyles => ({
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

type ItemVoteInfo = UserContent['voteInfo'][number];
type ContentItemWithVoteInfo = (PostsListWithVotes | CommentsList) & ItemVoteInfo;

const VoteHistoryTab = ({classes}: {classes: ClassesType}) => {
  const currentUser = useCurrentUser()
  const defaultLimit = 10;
  const pageSize = 30;
  const [limit, setLimit] = useState(defaultLimit);
  
  // pull the latest 10 posts that the current user has read
  const { data, fetchMore, networkStatus, loading } = useQuery(gql`
    query getVoteHistory($limit: Int) {
      UserVoteHistory(limit: $limit) {
        posts {
          ...PostsListWithVotes
        }
        comments {
          ...CommentsList
        }
        voteInfo
      }
    }
    ${fragmentTextForQuery("PostsListWithVotes")}
    ${fragmentTextForQuery("CommentsList")}
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
  
  const {SectionTitle, Loading, PostsItem, CommentsNode, LoadMore} = Components

  if (loading && networkStatus !== NetworkStatus.fetchMore) {
    return <Loading />
  }
  if (!data?.UserVoteHistory) {
    return null;
  }
  
  const posts: (PostsListWithVotes & {content_type: 'post'})[] = data.UserVoteHistory.posts
  const comments: (CommentsList & {content_type: 'comment'})[] = data.UserVoteHistory.comments
  const voteInfo: UserContent['voteInfo'] = data.UserVoteHistory.voteInfo


  // A matching voteInfo will always be present; TS thinks it's undefined because we're using `.find`
  const postsWithVoteInfo = posts.map(post => ({ ...post, ...voteInfo.find(v => v.documentId === post._id)! }));
  const commentsWithVoteInfo = comments.map(comment => ({ ...comment, ...voteInfo.find(v => v.documentId === comment._id)! }));

  // TODO: seems like this order might be wrong?
  const mixedFeed = [...postsWithVoteInfo, ...commentsWithVoteInfo].sort((a, b) => (
    new Date(a.votedAt).getTime() - new Date(b.votedAt).getTime()
  ));

  const isPostItem = (contentItem: ContentItemWithVoteInfo): contentItem is PostsListWithVotes & ItemVoteInfo => {
    return contentItem.collectionName === 'Posts';
  };

  const getContentItemNode = (item: ContentItemWithVoteInfo) => {
    if (isPostItem(item)) {
      return <PostsItem key={item._id} post={item}/>;
    } else {
      return <CommentsNode key={item._id} comment={item} treeOptions={{showPostTitle: true}} />
    }
  };
  
  console.log({ voteHistory: mixedFeed });
  // group the posts/commnts by when the user voted on them ("Today", "Yesterday", and "Older")
  const todaysContent = mixedFeed.filter(item => moment(item.votedAt).isSame(moment(), 'day'))
  const yesterdaysContent = mixedFeed.filter(item => moment(item.votedAt).isSame(moment().subtract(1, 'day'), 'day'))
  const olderContent = mixedFeed.filter(item => moment(item.votedAt).isBefore(moment().subtract(1, 'day'), 'day'))
  
  return <AnalyticsContext pageSectionContext="voteHistoryTab">
    {!!todaysContent.length && <SectionTitle title="Today"/>}
    {todaysContent?.map(getContentItemNode)}
    {!!yesterdaysContent.length && <SectionTitle title="Yesterday"/>}
    {yesterdaysContent?.map(getContentItemNode)}
    {!!olderContent.length && <SectionTitle title="Older"/>}
    {olderContent?.map(getContentItemNode)}
    <div className={classes.loadMore}>
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
    </div>
  </AnalyticsContext>
}


const VoteHistoryTabComponent = registerComponent('VoteHistoryTab', VoteHistoryTab, {styles})

declare global {
  interface ComponentTypes {
    VoteHistoryTab: typeof VoteHistoryTabComponent
  }
}
