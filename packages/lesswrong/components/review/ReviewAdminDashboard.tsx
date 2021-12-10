import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { REVIEW_YEAR } from '../../lib/reviewUtils';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import groupBy from 'lodash/groupBy';
import sortBy from 'lodash/sortBy';
import { useCurrentUser } from '../common/withUser';
import { userIsAdmin } from '../../lib/vulcan-users/permissions';


const styles = theme => ({
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

const ReviewAdminDashboard = ({classes}:{classes:ClassesType}) => {
  const { FormatDate, PostsItemMetaInfo, Loading, Error404, Typography, UsersNameDisplay } = Components
  const currentUser = useCurrentUser()

  const { results: votes, loading: votesLoading } = useMulti({
    terms: {view: "reviewVotesAdminDashboard", limit: 2000, year: REVIEW_YEAR+""},
    collectionName: "ReviewVotes",
    fragmentName: "reviewVoteWithUserAndPost",
    fetchPolicy: 'network-only',
  })

  const { results: users, loading: usersLoading } = useMulti({
    terms: {view: "reviewAdminUsers", limit: 2000},
    collectionName: "Users",
    fragmentName: "UsersWithReviewInfo",
    fetchPolicy: 'network-only',
  })

  const { results: notifications, loading: notificationsLoading } = useMulti({
    terms:{view:"adminAlertNotifications", type: "postNominated"},
    collectionName: "Notifications",
    fragmentName: 'NotificationsList',
    limit: 20,
    enableTotal: false
  })

  console.log(!notificationsLoading && notifications)

  if (!userIsAdmin(currentUser)) {
    return <Error404/>
  }

  const userRows = sortBy(
    Object.entries(groupBy(votes, (vote) => vote.userId)),
    obj => -(obj[1][0].user?.karma || 0)
  ) 

  return <div className={classes.root}>
    {votesLoading && <Loading/>}
    <div>
      <Typography variant="display1">Users ({userRows.length})</Typography>
      <div className={classes.voteItem} >
      <PostsItemMetaInfo className={classes.karma}>
          <b>Votes</b>
        </PostsItemMetaInfo>
        <PostsItemMetaInfo className={classes.karma}>
          <b>Karma</b>
        </PostsItemMetaInfo>
        <PostsItemMetaInfo className={classes.author}>
          <b>Username</b>
        </PostsItemMetaInfo>
        <PostsItemMetaInfo className={classes.author}>
          <b>Email</b>
        </PostsItemMetaInfo>
      </div>
      <p><i>1000+ karma users</i></p>
      {usersLoading && <Loading/>}
      {users && users.map(user => {
        return <div key={user._id} className={classes.voteItem}>
          <PostsItemMetaInfo className={classes.karma}>
            {user.reviewVoteCount}
          </PostsItemMetaInfo>
          <PostsItemMetaInfo className={classes.karma}>
            {user.karma}
          </PostsItemMetaInfo>
          <PostsItemMetaInfo className={classes.author}>
            <UsersNameDisplay user={user}/>
          </PostsItemMetaInfo>
          <PostsItemMetaInfo className={classes.author}>
            {user.email} 
          </PostsItemMetaInfo>
        </div>
      })}
      <p><i>Users with at least 1 vote</i></p>
      {votes && userRows.map(userRow => {
        return <div key={userRow[0]} className={classes.voteItem}>
          <PostsItemMetaInfo className={classes.karma}>
            {userRow[1].length}
          </PostsItemMetaInfo>
          <PostsItemMetaInfo className={classes.karma}>
            {userRow[1][0].user?.karma}
          </PostsItemMetaInfo>
          <PostsItemMetaInfo className={classes.author}>
            {userRow[1][0].user?.displayName}
          </PostsItemMetaInfo>
          <PostsItemMetaInfo className={classes.author}>
            {userRow[1][0].user?.email}
          </PostsItemMetaInfo>
        </div>
      })}
    </div>

    <div>
      <Typography variant="display1">All Votes ({votes.length})</Typography>
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
      {votes && votes.map(vote=><div className={classes.voteItem} key={vote._id}>
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

const ReviewAdminDashboardComponent = registerComponent('ReviewAdminDashboard', ReviewAdminDashboard, {styles});

declare global {
  interface ComponentTypes {
    ReviewAdminDashboard: typeof ReviewAdminDashboardComponent
  }
}