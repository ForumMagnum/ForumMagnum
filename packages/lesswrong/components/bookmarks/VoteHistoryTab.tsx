import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import moment from 'moment';
import { useMulti } from '../../lib/crud/withMulti';

const styles = (theme: ThemeType): JssStyles => ({
  loadMore: {
    marginTop: 10
  },
  loadMoreSpinner: {
    textAlign: 'left',
    paddingTop: 6,
    paddingLeft: 10,
    margin: 0
  },
  postItem: {
    marginBottom: 17,
  },
})

const VoteHistoryTab = ({classes}: {classes: ClassesType}) => {
  const defaultLimit = 10;
  const pageSize = 30;

  const { results: votes, loadMoreProps } = useMulti({
    terms: {
      view: "userVotes",
      collectionNames: ["Posts", "Comments"],
    },
    collectionName: "Votes",
    fragmentName: 'UserVotesWithDocument',
    limit: defaultLimit,
    itemsPerPage: pageSize,
  })
  
  const {SectionTitle, PostsItem, CommentsNode, LoadMore } = Components

  if (!votes) {
    return null;
  }

  const getContentItemNode = (vote: UserVotesWithDocument) => {
    if (vote.post) {
      const item = vote.post;
      return (
        <div className={classes.postItem}>
          <PostsItem key={item._id} post={item} isVoteable />
        </div>
      );
    } else if (vote.comment) {
      const item = vote.comment;
      return <CommentsNode
        key={item._id}
        comment={item}
        treeOptions={{showPostTitle: true}}
      />
    } else {
      // eslint-disable-next-line
      console.error("Invalid content item node:", vote);
    }
  };
  
  // group the posts/commnts by when the user voted on them ("Today", "Yesterday", and "Older")
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
    <div className={classes.loadMore}>
      <LoadMore
        {...loadMoreProps}
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
