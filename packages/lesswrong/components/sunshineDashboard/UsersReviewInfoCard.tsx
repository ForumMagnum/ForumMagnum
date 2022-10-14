/* global confirm */
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useUpdate } from '../../lib/crud/withUpdate';
import React, { useEffect, useState } from 'react';
import moment from 'moment';
import { useCurrentUser } from '../common/withUser';
import withErrorBoundary from '../common/withErrorBoundary'
import DoneIcon from '@material-ui/icons/Done';
import FlagIcon from '@material-ui/icons/Flag';
import SnoozeIcon from '@material-ui/icons/Snooze';
import AddAlarmIcon from '@material-ui/icons/AddAlarm';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import OutlinedFlagIcon from '@material-ui/icons/OutlinedFlag';
import DescriptionIcon from '@material-ui/icons/Description'
import { useMulti } from '../../lib/crud/withMulti';
import MessageIcon from '@material-ui/icons/Message'
import * as _ from 'underscore';
import { DatabasePublicSetting } from '../../lib/publicSettings';
import Input from '@material-ui/core/Input';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import classNames from 'classnames';
import {defaultModeratorPMsTagSlug} from "./SunshineNewUsersInfo";

export const getTitle = (s: string|null) => s ? s.split("\\")[0] : ""

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
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
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

interface UserContentCountPartial {
  postCount?: number,
  commentCount?: number
}

export function getCurrentContentCount(user: UserContentCountPartial) {
  const postCount = user.postCount ?? 0
  const commentCount = user.commentCount ?? 0
  return postCount + commentCount
}

export function getNewSnoozeUntilContentCount(user: UserContentCountPartial, contentCount: number) {
  return getCurrentContentCount(user) + contentCount
}

const UsersReviewInfoCard = ({ user, classes }: {
  user: SunshineUsersList,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  
  const { mutate: updateUser } = useUpdate({
    collectionName: "Users",
    fragmentName: 'SunshineUsersList',
  })
  
  const [notes, setNotes] = useState(user.sunshineNotes || "")
  const [contentSort, setContentSort] = useState<'baseScore' | 'postedAt'>("baseScore")
  
  const canReview = !!(user.maxCommentCount || user.maxPostCount)
  
  const handleNotes = () => {
    if (notes != user.sunshineNotes) {
      void updateUser({
        selector: {_id: user._id},
        data: {
          sunshineNotes: notes
        }
      })
    }
  }
  
  useEffect(() => {
    return () => {
      handleNotes();
    }
  });
  
  const handleReview = () => {
    if (canReview) {
      void updateUser({
        selector: {_id: user._id},
        data: {
          sunshineFlagged: false,
          reviewedByUserId: currentUser!._id,
          reviewedAt: new Date(),
          needsReview: false,
          sunshineNotes: notes,
          snoozedUntilContentCount: null
        }
      })
    }
  }
  
  const handleSnooze = (contentCount: number) => {
    const newNotes = signatureWithNote(`Snooze ${contentCount}`)+notes;
    void updateUser({
      selector: {_id: user._id},
      data: {
        needsReview: false,
        reviewedAt: new Date(),
        reviewedByUserId: currentUser!._id,
        sunshineNotes: newNotes,
        snoozedUntilContentCount: getNewSnoozeUntilContentCount(user, contentCount)
      }
    })
    setNotes( newNotes )
  }
  
  const banMonths = 3
  
  const handleBan = () => {
    const newNotes = signatureWithNote("Ban") + notes;
    if (confirm(`Ban this user for ${banMonths} months?`)) {
      void updateUser({
        selector: {_id: user._id},
        data: {
          sunshineFlagged: false,
          reviewedByUserId: currentUser!._id,
          voteBanned: true,
          needsReview: false,
          reviewedAt: new Date(),
          banned: moment().add(banMonths, 'months').toDate(),
          sunshineNotes: newNotes
        }
      })
      setNotes( newNotes )
    }
  }
  
  const handlePurge = () => {
    if (confirm("Are you sure you want to delete all this user's posts, comments and votes?")) {
      void updateUser({
        selector: {_id: user._id},
        data: {
          sunshineFlagged: false,
          reviewedByUserId: currentUser!._id,
          nullifyVotes: true,
          voteBanned: true,
          deleteContent: true,
          needsReview: false,
          reviewedAt: new Date(),
          banned: moment().add(1000, 'years').toDate(),
          sunshineNotes: notes
        }
      })
      setNotes( signatureWithNote("Purge")+notes )
    }
  }
  
  const handleFlag = () => {
    void updateUser({
      selector: {_id: user._id},
      data: {
        sunshineFlagged: !user.sunshineFlagged,
        sunshineNotes: notes
      }
    })
    
    const flagStatus = user.sunshineFlagged ? "Unflag" : "Flag"
    setNotes( signatureWithNote(flagStatus)+notes )
  }
  
  const handleDisablePosting = () => {
    const abled = user.postingDisabled ? 'enabled' : 'disabled';
    const newNotes = signatureWithNote(`posting ${abled}`) + notes;
    void updateUser({
      selector: {_id: user._id},
      data: {
        postingDisabled: !user.postingDisabled,
        sunshineNotes: newNotes
      }
    })
    setNotes( newNotes )
  }
  
  const handleDisableAllCommenting = () => {
    const abled = user.allCommentingDisabled ? 'enabled' : 'disabled';
    const newNotes = signatureWithNote(`all commenting ${abled}`) + notes;
    void updateUser({
      selector: {_id: user._id},
      data: {
        allCommentingDisabled: !user.allCommentingDisabled,
        sunshineNotes: newNotes
      }
    })
    setNotes( newNotes )
  }
  
  const handleDisableCommentingOnOtherUsers = () => {
    const abled = user.commentingOnOtherUsersDisabled ? 'enabled' : 'disabled'
    const newNotes = signatureWithNote(`commenting on other's ${abled}`) + notes;
    void updateUser({
      selector: {_id: user._id},
      data: {
        commentingOnOtherUsersDisabled: !user.commentingOnOtherUsersDisabled,
        sunshineNotes: newNotes
      }
    })
    setNotes( newNotes )
  }
  
  const handleDisableConversations = () => {
    const abled = user.conversationsDisabled ? 'enabled' : 'disabled'
    const newNotes = signatureWithNote(`conversations ${abled}`) + notes;
    void updateUser({
      selector: {_id: user._id},
      data: {
        conversationsDisabled: !user.conversationsDisabled,
        sunshineNotes: newNotes
      }
    })
    setNotes( newNotes )
  }
  
  const { results: posts, loading: postsLoading } = useMulti({
    terms:{view:"sunshineNewUsersPosts", userId: user._id},
    collectionName: "Posts",
    fragmentName: 'SunshinePostsList',
    fetchPolicy: 'cache-and-network',
    limit: 50
  });
  
  const { results: comments, loading: commentsLoading } = useMulti({
    terms:{view:"sunshineNewUsersComments", userId: user._id},
    collectionName: "Comments",
    fragmentName: 'CommentsListWithParentMetadata',
    fetchPolicy: 'cache-and-network',
    limit: 50
  });
  
  const commentKarmaPreviews = comments ? _.sortBy(comments, contentSort) : []
  const postKarmaPreviews = posts ? _.sortBy(posts, contentSort) : []
  
  const { MetaInfo, FormatDate, SunshineNewUserPostsList, SunshineNewUserCommentsList, CommentKarmaWithPreview, PostKarmaWithPreview, LWTooltip, Loading, Typography, SunshineSendMessageWithDefaults, UsersNameWrapper, ModeratorMessageCount } = Components
  
  const hiddenPostCount = user.maxPostCount - user.postCount
  const hiddenCommentCount = user.maxCommentCount - user.commentCount
  
  if (!userCanDo(currentUser, "posts.moderate.all")) return null
  
  const getTodayString = () => {
    const today = new Date();
    return today.toLocaleString('default', { month: 'short', day: 'numeric'});
  }
  
  const signature = `${currentUser?.displayName}, ${getTodayString()}`
  const signatureWithNote = (note:string) => {
    return `${signature}: ${note}\n`
  }
  
  const signAndDate = (sunshineNotes:string) => {
    if (!sunshineNotes.match(signature)) {
      const padding = !sunshineNotes ? ": " : ": \n\n"
      return signature + padding + sunshineNotes
    }
    return sunshineNotes
  }
  
  const handleClick = () => {
    const signedNotes = signAndDate(notes)
    if (signedNotes != notes) {
      setNotes(signedNotes)
    }
  }
  
  const permissionsRow = <div className={classes.permissionsRow}>
      <LWTooltip title={`${user.postingDisabled ? "Enable" : "Disable"} this user's ability to create posts`}>
        <div className={classNames(classes.permissionsButton, {[classes.permissionDisabled]: user.postingDisabled})} onClick={handleDisablePosting}>
          Posts
        </div>
      </LWTooltip>
      <LWTooltip title={`${user.allCommentingDisabled ? "Enable" : "Disable"} this user's to comment (including their own shortform)`}>
        <div className={classNames(classes.permissionsButton, {[classes.permissionDisabled]: user.allCommentingDisabled})} onClick={handleDisableAllCommenting}>
          All Comments
        </div>
      </LWTooltip>
      <LWTooltip title={`${user.commentingOnOtherUsersDisabled ? "Enable" : "Disable"} this user's ability to comment on other people's posts`}>
        <div className={classNames(classes.permissionsButton, {[classes.permissionDisabled]: user.commentingOnOtherUsersDisabled})} onClick={handleDisableCommentingOnOtherUsers}>
          Other Comments
        </div>
      </LWTooltip>
      <LWTooltip title={`${user.conversationsDisabled ? "Enable" : "Disable"} this user's ability to start new private conversations`}>
        <div className={classNames(classes.permissionsButton, {[classes.permissionDisabled]: user.conversationsDisabled})}onClick={handleDisableConversations}>
          Conversations
        </div>
      </LWTooltip>
    </div>
  
  return (
    <div className={classes.root}>
      <Typography variant="body2">
        <MetaInfo>
          <div className={classes.info}>
            {user.reviewedAt ? <p><em>Reviewed <FormatDate date={user.reviewedAt}/> ago by <UsersNameWrapper documentId={user.reviewedByUserId}/></em></p> : null }
            {user.banned ? <p><em>Banned until <FormatDate date={user.banned}/></em></p> : null }
            <div>ReCaptcha Rating: {user.signUpReCaptchaRating || "no rating"}</div>
            <div dangerouslySetInnerHTML={{__html: user.htmlBio}} className={classes.bio}/>
            {user.website && <div>Website: <a href={`https://${user.website}`} target="_blank" rel="noopener noreferrer" className={classes.website}>{user.website}</a></div>}
            <div className={classes.notes}>
              <Input
                value={notes}
                fullWidth
                onChange={e => setNotes(e.target.value)}
                onClick={e => handleClick()}
                disableUnderline
                placeholder="Notes for other moderators"
                multiline
              />
            </div>
          </div>
          <div className={classes.row}>
            <div className={classes.row}>
              <LWTooltip title="Snooze 10 (Appear in sidebar after 10 posts and/or comments)" placement="top">
                <AddAlarmIcon className={classNames(classes.snooze10, classes.modButton)} onClick={() => handleSnooze(10)}/>
              </LWTooltip>
              <LWTooltip title="Snooze 1 (Appear in sidebar on next post or comment)" placement="top">
                <SnoozeIcon className={classes.modButton} onClick={() => handleSnooze(1)}/>
              </LWTooltip>
              <LWTooltip title="Approve" placement="top">
                <DoneIcon onClick={handleReview} className={classNames(classes.modButton, {[classes.canReview]: !classes.disabled })}/>
              </LWTooltip>
              <LWTooltip title="Ban for 3 months" placement="top">
                <RemoveCircleOutlineIcon className={classes.modButton} onClick={handleBan} />
              </LWTooltip>
              <LWTooltip title="Purge (delete and ban)" placement="top">
                <DeleteForeverIcon className={classes.modButton} onClick={handlePurge} />
              </LWTooltip>
              <LWTooltip title={user.sunshineFlagged ? "Unflag this user" : <div>
                <div>Flag this user for more review</div>
                <div><em>(This will not remove them from sidebar)</em></div>
              </div>} placement="top">
                <div onClick={handleFlag} className={classes.modButton} >
                  {user.sunshineFlagged ? <FlagIcon /> : <OutlinedFlagIcon />}
                </div>
              </LWTooltip>
            </div>
            <div className={classes.row}>
              <ModeratorMessageCount userId={user._id} />
              <SunshineSendMessageWithDefaults user={user} tagSlug={defaultModeratorPMsTagSlug.get()}/>
            </div>
          </div>
          {permissionsRow}
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
          <div>
            Sort by: <span className={classNames(classes.sortButton, {[classes.sortSelected]: contentSort === "baseScore"})} onClick={() => setContentSort("baseScore")}>
                karma
              </span>
            <span className={classNames(classes.sortButton, {[classes.sortSelected]: contentSort === "postedAt"})} onClick={() => setContentSort("postedAt")}>
                postedAt
              </span>
          </div>
          <div>
            <LWTooltip title="Post count">
                <span>
                  { user.postCount || 0 }
                  <DescriptionIcon className={classes.hoverPostIcon}/>
                </span>
            </LWTooltip>
            {postKarmaPreviews.map(post => <PostKarmaWithPreview key={post._id} post={post}/>)}
            { hiddenPostCount ? <span> ({hiddenPostCount} deleted)</span> : null}
          </div>
          {(commentsLoading || postsLoading) && <Loading/>}
          <div>
            <LWTooltip title="Comment count">
              { user.commentCount || 0 }
            </LWTooltip>
            <MessageIcon className={classes.icon}/>
            {commentKarmaPreviews.map(comment => <CommentKarmaWithPreview key={comment._id} comment={comment}/>)}
            { hiddenCommentCount ? <span> ({hiddenCommentCount} deleted)</span> : null}
          </div>
          <SunshineNewUserPostsList posts={posts} user={user}/>
          <SunshineNewUserCommentsList comments={comments} user={user}/>
        </MetaInfo>
      </Typography>
    </div>
  )
}

const UsersReviewInfoCardComponent = registerComponent('UsersReviewInfoCard', UsersReviewInfoCard, {
  styles,
  hocs: [
    withErrorBoundary,
  ]
});

declare global {
  interface ComponentTypes {
    UsersReviewInfoCard: typeof UsersReviewInfoCardComponent
  }
}


