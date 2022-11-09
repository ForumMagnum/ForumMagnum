/* global confirm */
import { Components, registerComponent } from '../../lib/vulcan-lib';
import React, { useState } from 'react';
import withErrorBoundary from '../common/withErrorBoundary'
import DescriptionIcon from '@material-ui/icons/Description'
import { useMulti } from '../../lib/crud/withMulti';
import MessageIcon from '@material-ui/icons/Message'
import * as _ from 'underscore';
import classNames from 'classnames';
import { userCanDo } from '../../lib/vulcan-users';
import { UserReviewStatus } from './ModeratorUserInfo/UserReviewStatus';
import { ContentSummaryRows } from './ModeratorUserInfo/ContentSummaryRows';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    backgroundColor: theme.palette.grey[50]
  },
  icon: {
    height: 13,
    color: theme.palette.grey[500],
    position: "relative",
    top: 3
  },
  hoverPostIcon: {
    height: 16,
    color: theme.palette.grey[700],
    position: "relative",
    top: 3
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  qualitySignalRow: {
  },
  permissionsRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 8
  },
  disabled: {
    opacity: .2,
    cursor: "default"
  },
  bigDownvotes: {
    color: theme.palette.error.dark,
    padding: 6,
    paddingTop: 3,
    paddingBottom: 3,
    marginRight:8,
    borderRadius: "50%",
    fontWeight: 600,
  },
  downvotes: {
    color: theme.palette.error.dark,
    opacity: .75,
    padding: 6,
    paddingTop: 3,
    paddingBottom: 3,
    marginRight:8,
    borderRadius: "50%",
  },
  upvotes: {
    color: theme.palette.primary.dark,
    opacity: .75,
    padding: 6,
    paddingTop: 3,
    paddingBottom: 3,
    marginRight:8,
    borderRadius: "50%",
  },
  bigUpvotes: {
    color: theme.palette.primary.dark,
    padding: 6,
    paddingTop: 3,
    paddingBottom: 3,
    marginRight:8,
    borderRadius: "50%",
    fontWeight: 600,
  },
  votesRow: {
    marginTop: 12,
    marginBottom: 12
  },
  hr: {
    height: 0,
    borderTop: "none",
    borderBottom: theme.palette.border.sunshineNewUsersInfoHR,
  },
  notes: {
    border: theme.palette.border.normal,
    borderRadius: 2,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 4,
    paddingBottom: 4,
    marginTop: 8,
    marginBottom: 8
  },
  defaultMessage: { //UNUSED
    maxWidth: 500,
    backgroundColor: theme.palette.panelBackground.default,
    padding:12,
    boxShadow: theme.palette.boxShadow.sunshineSendMessage,
  },
  sortButton: {
    marginLeft: 6,
    cursor: "pointer"
  },
  sortSelected: {
    color: theme.palette.grey[900]
  },
  bio: {
    '& a': {
      color: theme.palette.primary.main,
    },
  },
  website: {
    color: theme.palette.primary.main,
  },
  info: {
    '& > * + *': {
      marginTop: 8,
    },
  },
  modButton:{
    marginTop: 6,
    marginRight: 16,
    cursor: "pointer",
    '&:hover': {
      opacity: .5
    }
  },
  snooze10: {
    color: theme.palette.primary.main,
    fontSize: 34,
    marginTop: 4
  },
  permissionsButton: {
    fontSize: 10,
    padding: 6,
    paddingTop: 3,
    paddingBottom: 3,
    border: theme.palette.border.normal,
    borderRadius: 2,
    marginRight: 10,
    cursor: "pointer"
  },
  permissionDisabled: {
    border: "none"
  }
})

const SunshineNewUsersInfo = ({ user, classes, refetch, currentUser }: {
  user: SunshineUsersList,
  classes: ClassesType,
  refetch: () => void,
  currentUser: UsersCurrent
}) => {

  const { results: posts = [], loading: postsLoading } = useMulti({
    terms:{view:"sunshineNewUsersPosts", userId: user._id},
    collectionName: "Posts",
    fragmentName: 'SunshinePostsList',
    fetchPolicy: 'cache-and-network',
    limit: 40
  });

  const { results: comments = [], loading: commentsLoading } = useMulti({
    terms:{view:"sunshineNewUsersComments", userId: user._id},
    collectionName: "Comments",
    fragmentName: 'CommentsListWithParentMetadata',
    fetchPolicy: 'cache-and-network',
    limit: 40
  });

  const { MetaInfo, SunshineNewUserPostsList, SunshineNewUserCommentsList, ContentSummaryRows, LWTooltip, Loading, Typography, SunshineSendMessageWithDefaults, UserReviewStatus, ModeratorMessageCount, ModeratorActions } = Components

  if (!userCanDo(currentUser, "posts.moderate.all")) return null

  return (
      <div className={classes.root}>
        <Typography variant="body2">
          <MetaInfo>
            <div className={classes.info}>
              <div className={classes.topRow}>
                <div>
                  <UserReviewStatus user={user}/>
              
                  {user.associatedClientId?.firstSeenReferrer && <div className={classes.qualitySignalRow}>Initial referrer: {user.associatedClientId?.firstSeenReferrer}</div>}
                  {user.associatedClientId?.firstSeenLandingPage && <div className={classes.qualitySignalRow}>Initial landing page: {user.associatedClientId?.firstSeenLandingPage}</div>}
                  {(user.associatedClientId?.userIds?.length??0) > 1 && <div className={classes.qualitySignalRow}>
                    <em>Alternate accounts detected</em>
                  </div>}
                  <div className={classes.qualitySignalRow}>ReCaptcha Rating: {user.signUpReCaptchaRating || "no rating"}</div>
                </div>
                <div className={classes.row}>
                  <ModeratorMessageCount userId={user._id} />
                  <SunshineSendMessageWithDefaults user={user}/>
                </div>
              </div>              
              <div dangerouslySetInnerHTML={{__html: user.htmlBio}} className={classes.bio}/>
              {user.website && <div>Website: <a href={`https://${user.website}`} target="_blank" rel="noopener noreferrer" className={classes.website}>{user.website}</a></div>}
            </div>
            <ModeratorActions user={user} currentUser={currentUser} comments={comments} posts={posts} refetch={refetch}/>
            <hr className={classes.hr}/>
            <div className={classes.votesRow}>
              <span>Votes: </span>
              <LWTooltip title="Big Upvotes">
                <span className={classes.bigUpvotes}>
                  { user.bigUpvoteCount || 0 }
                </span>
              </LWTooltip>
              <LWTooltip title="Upvotes">
                <span className={classes.upvotes}>
                  { user.smallUpvoteCount || 0 }
                </span>
              </LWTooltip>
              <LWTooltip title="Downvotes">
                <span className={classes.downvotes}>
                  { user.smallDownvoteCount || 0 }
                </span>
              </LWTooltip>
              <LWTooltip title="Big Downvotes">
                <span className={classes.bigDownvotes}>
                  { user.bigDownvoteCount || 0 }
                </span>
              </LWTooltip>
            </div>
            <ContentSummaryRows user={user} posts={posts} comments={comments} loading={postsLoading || commentsLoading}/>
            <SunshineNewUserPostsList posts={posts} user={user}/>
            <SunshineNewUserCommentsList comments={comments} user={user}/>
          </MetaInfo>
        </Typography>
      </div>
  )
}

const SunshineNewUsersInfoComponent = registerComponent('SunshineNewUsersInfo', SunshineNewUsersInfo, {
  styles,
  hocs: [
    withErrorBoundary,
  ]
});

declare global {
  interface ComponentTypes {
    SunshineNewUsersInfo: typeof SunshineNewUsersInfoComponent
  }
}


