import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { REVIEW_YEAR } from '../../lib/reviewUtils';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = theme => ({
  voteItem: {
    display: "flex"
  },
  author: {
    width: 200
  },
  karma: {
    width: 30
  },
  date: {
    width: 30
  }
})

const ReviewAdminDashboard = ({classes}:{classes:ClassesType}) => {
  const { LoadMore, FormatDate, PostsItemMetaInfo, SingleColumnSection, Loading } = Components

  const { results: dbVotes, loading: votesLoading, loadMoreProps } = useMulti({
    terms: {view: "reviewVotesAdminDashboard", limit: 600, year: REVIEW_YEAR+""},
    collectionName: "ReviewVotes",
    fragmentName: "reviewVoteWithUserAndPost",
    fetchPolicy: 'network-only',
  })



  

  return <SingleColumnSection>
    {votesLoading && <Loading/>}
    {dbVotes && dbVotes.map(vote=><div className={classes.voteItem} key={vote._id}>
      <PostsItemMetaInfo className={classes.date}>
        <FormatDate date={vote.createdAt}/>
      </PostsItemMetaInfo>
      <PostsItemMetaInfo className={classes.karma}>
        {vote.user?.karma}
      </PostsItemMetaInfo>
      <PostsItemMetaInfo className={classes.author}>
        {vote.user?.displayName}
      </PostsItemMetaInfo>
    </div>)}
    <LoadMore {...loadMoreProps}/>
  </SingleColumnSection>
}

const ReviewAdminDashboardComponent = registerComponent('ReviewAdminDashboard', ReviewAdminDashboard, {styles});

declare global {
  interface ComponentTypes {
    ReviewAdminDashboard: typeof ReviewAdminDashboardComponent
  }
}