import React, { useState } from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { registerComponent } from '../../lib/vulcan-lib/components';
import groupBy from 'lodash/groupBy';
import sortBy from 'lodash/sortBy';
import { useCurrentUser } from '../common/withUser';
import { userIsAdmin } from '../../lib/vulcan-users/permissions';
import { useLocation } from '../../lib/routeUtil';
import { FormatDate } from "../common/FormatDate";
import { PostsItemMetaInfo } from "../posts/PostsItemMetaInfo";
import { Loading } from "../vulcan-core/Loading";
import { Error404 } from "../common/Error404";
import { Typography } from "../common/Typography";
import { UsersNameDisplay } from "../users/UsersNameDisplay";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    justifyContent: "space-around"
  },
  voteItem: {
    display: "flex"
  },
  author: {
    width: 200
  },
  count: {
    width: 50,
    color: theme.palette.grey[400]
  },
  karma: {
    width: 100
  },
  date: {
    width: 40
  },
  voteCount: {
    width: 75
  }
})

const ReviewAdminDashboardInner = ({classes}: {classes: ClassesType<typeof styles>}) => {
  const currentUser = useCurrentUser()
  const { params: {year} } = useLocation()
  
  const [sortField, setSortField] = useState('votes');

  // TODO: fix the bug where for some reason this doesn't work for 2020 votes
  const { results: votes, loading: votesLoading, totalCount } = useMulti({
    terms: {view: "reviewVotesAdminDashboard", limit: 5000, year: year},
    collectionName: "ReviewVotes",
    fragmentName: "reviewAdminDashboard",
    fetchPolicy: 'network-only',
    enableTotal: true
  })

  // NOTE: this is for showing top-karma users and seeing if they voted
  // it didn't seem that important, and with the 5000 vote limit, it seemed
  // not worth the extra load time. But leaving in incase we want to revert

  // const { results: users, loading: usersLoading } = useMulti({
  //   terms: {view: "reviewAdminUsers", limit: 500},
  //   collectionName: "Users",
  //   fragmentName: "UsersWithReviewInfo",
  //   fetchPolicy: 'network-only'
  // })

  if (!userIsAdmin(currentUser)) {
    return <Error404/>
  }

  const userRows = sortBy(
    Object.entries(groupBy(votes, (vote) => vote.userId)),
    obj => {
      const user = obj[1][0].user;
      if (sortField === 'votes') {
        return -obj[1].length;
      } else if (sortField === 'karma') {
        return -(user?.karma || 0);
      } else {
        return 0;
      }
    }
  ) 

  return <div className={classes.root}>
    <div>
      <Typography variant="display1">Users ({userRows.length})</Typography>
      <br/>
      <div className={classes.voteItem} >
        <PostsItemMetaInfo className={classes.count}>
          <b>Count</b>
        </PostsItemMetaInfo>
        <PostsItemMetaInfo className={classes.karma}>
          <b onClick={() => setSortField('votes')}><a>Votes</a></b>
        </PostsItemMetaInfo>
        <PostsItemMetaInfo className={classes.karma}>
          <b onClick={() => setSortField('karma')}><a>Karma</a></b>
        </PostsItemMetaInfo>
        <PostsItemMetaInfo className={classes.author}>
          <b>Username</b>
        </PostsItemMetaInfo>
      </div>
      <p><i>Users with at least 1 vote</i></p>
      {votes && userRows.map((userRow, i) => {
        // eslint-disable-next-line no-console
        return <div key={userRow[0]} className={classes.voteItem} onClick={()=> console.log(userRow)}>
          <PostsItemMetaInfo className={classes.count}>
            {i+1}
          </PostsItemMetaInfo>
          <PostsItemMetaInfo className={classes.karma}>
            {userRow[1].length}
          </PostsItemMetaInfo>
          <PostsItemMetaInfo className={classes.karma}>
            {userRow[1][0].user?.karma}
          </PostsItemMetaInfo>
          <PostsItemMetaInfo className={classes.author}>
            {userRow[1][0].user?.displayName}
          </PostsItemMetaInfo>
        </div>
      })}
      {/* <p><i>1000+ karma users</i></p>
      {usersLoading && <Loading/>}
      {users && users.map((user, i) => {
        return <div key={user._id} className={classes.voteItem}>
          <PostsItemMetaInfo className={classes.count}>
            {i+1}
          </PostsItemMetaInfo>
          <PostsItemMetaInfo className={classes.karma}>
            {user.reviewVoteCount}
          </PostsItemMetaInfo>
          <PostsItemMetaInfo className={classes.karma}>
            {user.karma}
          </PostsItemMetaInfo>
          <PostsItemMetaInfo className={classes.author}>
            <UsersNameDisplay user={user}/>
          </PostsItemMetaInfo>
        </div>
      })} */}
    </div>

    <div>
      <Typography variant="display1">All Votes ({totalCount})</Typography>
      {totalCount && totalCount > 5000 && <p><em>Only showing first 5000</em></p>}
      <br/>
      {votesLoading && <Loading/>}
      <div className={classes.voteItem} >
        <PostsItemMetaInfo className={classes.date}>
          <b>Date</b>
        </PostsItemMetaInfo>
        <PostsItemMetaInfo className={classes.karma}>
          <b>Karma</b>
        </PostsItemMetaInfo>
        <PostsItemMetaInfo className={classes.author}>
          <b>Username</b>
        </PostsItemMetaInfo>
      </div>
      {/* eslint-disable-next-line no-console */}
      {votes && votes.map(vote=><div className={classes.voteItem} key={vote._id} onClick={() => console.log(vote)}>
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
    </div>
  </div>
}

export const ReviewAdminDashboard = registerComponent('ReviewAdminDashboard', ReviewAdminDashboardInner, {styles});


