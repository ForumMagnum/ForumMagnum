import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import moment from 'moment';
import { useMulti } from '../../lib/crud/withMulti';
import { commentsNodeRootMarginBottom, maxSmallish, maxTiny } from '../../themes/globalStyles/globalStyles';
import { Loading } from "../vulcan-core/Loading";
import { SectionTitle } from "../common/SectionTitle";
import { PostsItem } from "../posts/PostsItem";
import { CommentsNode } from "../comments/CommentsNode";
import { LoadMore } from "../common/LoadMore";

const styles = (theme: ThemeType) => ({
  empty: {
    color: theme.palette.grey[600],
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontWeight: 500,
    fontSize: 14,
    lineHeight: "1.6em",
    marginBottom: 40,
  },
  loadMoreSpinner: {
    textAlign: 'left',
    paddingTop: 6,
    paddingLeft: 10,
    margin: 0
  },
  postItem: {
    marginBottom: commentsNodeRootMarginBottom,
    [maxSmallish]: {
      marginBottom: 10,
    },
    [maxTiny]: {
      marginBottom: 8,
    },
  },
})

const VoteHistoryTabInner = ({classes}: {classes: ClassesType<typeof styles>}) => {
  const defaultLimit = 10;
  const pageSize = 30;

  const { results: votes, loading, loadMoreProps } = useMulti({
    terms: {
      view: "userVotes",
      collectionNames: ["Posts", "Comments"],
    },
    collectionName: "Votes",
    fragmentName: 'UserVotesWithDocument',
    limit: defaultLimit,
    itemsPerPage: pageSize,
  })
  
  /**
   * Returns either a PostItem or CommentsNode, depending on the content type
  */
  const getContentItemNode = (vote: UserVotesWithDocument) => {
    if (vote.post) {
      const item = vote.post;
      return (
        <div key={item._id} className={classes.postItem}>
          <PostsItem post={item} isVoteable />
        </div>
      );
    } else if (vote.comment) {
      const item = vote.comment;
      return <CommentsNode
        key={item._id}
        comment={item}
        treeOptions={{showPostTitle: true, forceNotSingleLine: true, post: item.post || undefined}}
        truncated
      />
    }
    return null
  }
  if (loading && !votes) {
    return <Loading />
  }
  if (!votes) {
    return null
  }
  if (!votes.length) {
    return <div className={classes.empty}>{"You haven't voted on anything yet."}</div>
  }
  
  // group the posts/comments by when the user voted on them ("Today", "Yesterday", and "Older")
  const todaysContent = votes.filter(v => moment(v.votedAt).isSame(moment(), 'day'))
  const yesterdaysContent = votes.filter(v => moment(v.votedAt).isSame(moment().subtract(1, 'day'), 'day'))
  const olderContent = votes.filter(v => moment(v.votedAt).isBefore(moment().subtract(1, 'day'), 'day'))
  
  return <AnalyticsContext pageSectionContext="voteHistoryTab">
    {!!todaysContent.length && <SectionTitle title="Today"/>}
    {todaysContent.map((vote) => getContentItemNode(vote))}
    {!!yesterdaysContent.length && <SectionTitle title="Yesterday"/>}
    {yesterdaysContent.map((vote) => getContentItemNode(vote))}
    {!!olderContent.length && <SectionTitle title="Older"/>}
    {olderContent.map((vote) => getContentItemNode(vote))}
    <div>
      <LoadMore
        {...loadMoreProps}
        loadingClassName={classes.loadMoreSpinner}
      />
    </div>
  </AnalyticsContext>
}


export const VoteHistoryTab = registerComponent('VoteHistoryTab', VoteHistoryTabInner, {styles})


