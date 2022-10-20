/* global confirm */
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useUpdate } from '../../lib/crud/withUpdate';
import React, { useState } from 'react';
import moment from 'moment';
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
import Input from '@material-ui/core/Input';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import classNames from 'classnames';
import { Link } from '../../lib/reactRouterWrapper';
import { userGetProfileUrl} from '../../lib/collections/users/helpers';
import { MODERATOR_ACTION_TYPES, RATE_LIMIT_ONE_PER_DAY } from '../../lib/collections/moderatorActions/schema';
import { useCreate } from '../../lib/crud/withCreate';


export const getTitle = (s: string|null) => s ? s.split("\\")[0] : ""

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    backgroundColor: theme.palette.grey[0],
    boxShadow: theme.palette.boxShadow.eventCard,
    marginBottom: 16,
    ...theme.typography.body2,
    fontSize: "1rem"
  },
  displayName: {
    marginTop: 4,
    fontSize: theme.typography.body2.fontSize,
    marginBottom: 16
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
    alignItems: "center",
  },
  permissionsRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
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
  notes: {
    border: theme.palette.border.normal,
    borderRadius: 2,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 4,
    paddingBottom: 4,
    marginTop: 8,
    marginBottom: 8,
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
    }
  },
  website: {
    color: theme.palette.primary.main,
  },
  info: {
    // '& > * + *': {
    //   marginTop: 8,
    // },
    display: 'flex',
    flexWrap: 'wrap'
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
    padding: 6,
    paddingTop: 3,
    paddingBottom: 3,
    border: theme.palette.border.normal,
    borderRadius: 2,
    marginRight: 8,
    marginBottom: 8,
    cursor: "pointer",
    whiteSpace: "nowrap"
  },
  permissionDisabled: {
    border: "none"
  },
  columns: {
    display: 'flex'
  },
  infoColumn: {
    width: '30%',
    padding: 16,
    borderRight: theme.palette.border.extraFaint,
  },
  contentColumn: {
    width: '35%',
    padding: 16,
    borderRight: theme.palette.border.extraFaint,
    position: "relative"
  },
  actionsColumn: {
    width: '35%',
    padding: 16
  },
  content: {
    marginTop: 16,
    marginBottom: 8,
    borderTop: theme.palette.border.extraFaint
  },
  expandButton: {
    display: "flex",
    justifyContent: "right",
    color: theme.palette.grey[500]
  },
  contentCollapsed: {
    maxHeight: 300,
    overflow: "hidden"
  },
  contentSummaryRow: {
    display: "flex",
    flexWrap: "wrap"
  },
  reviewedAt: {
    marginTop: 16,
    fontStyle: "italic"
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

const UsersReviewInfoCard = ({ user, refetch, currentUser, classes }: {
  user: SunshineUsersList,
  currentUser: UsersCurrent,
  refetch: () => void,
  classes: ClassesType,
}) => {
  
  const { mutate: updateUser } = useUpdate({
    collectionName: "Users",
    fragmentName: 'SunshineUsersList',
  })

  const { mutate: updateModeratorAction } = useUpdate({
    collectionName: 'ModeratorActions',
    fragmentName: 'ModeratorActionsDefaultFragment'
  });

  const { create: createModeratorAction } = useCreate({
    collectionName: 'ModeratorActions',
    fragmentName: 'ModeratorActionsDefaultFragment'
  });
  
  const [notes, setNotes] = useState(user.sunshineNotes || "")
  const [contentSort, setContentSort] = useState<'baseScore' | 'postedAt'>("baseScore")
  const [contentExpanded, setContentExpanded] = useState<boolean>(false)
  
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
  
  // useEffect(() => {
  //   return () => {
  //     handleNotes();
  //   }
  // });
  
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

  const mostRecentRateLimit = user.moderatorActions.find(modAction => modAction.type === RATE_LIMIT_ONE_PER_DAY);

  const handleRateLimit = async () => {
    const addedOrRemoved = mostRecentRateLimit?.active ? 'removed' : 'added';
    const newNotes = signatureWithNote(`rate limit ${addedOrRemoved}`) + notes;
    await updateUser({
      selector: { _id: user._id },
      data: { sunshineNotes: newNotes }
    });

    // If we have an active rate limit, we want to disable it
    if (mostRecentRateLimit?.active) {
      await updateModeratorAction({
        selector: { _id: mostRecentRateLimit._id },
        data: { endedAt: new Date() }
      });
    } else {
      // Otherwise, we want to create a new one
      await createModeratorAction({
        data: {
          type: RATE_LIMIT_ONE_PER_DAY,
          userId: user._id,
        }
      });
    }

    setNotes(newNotes);
    // Refetch to ensure the button displays (toggled on/off) properly 
    refetch();
  }
  
  const { results: posts, loading: postsLoading } = useMulti({
    terms:{view:"sunshineNewUsersPosts", userId: user._id},
    collectionName: "Posts",
    fragmentName: 'SunshinePostsList',
    fetchPolicy: 'cache-and-network',
    limit: 10
  });
  
  const { results: comments, loading: commentsLoading } = useMulti({
    terms:{view:"sunshineNewUsersComments", userId: user._id},
    collectionName: "Comments",
    fragmentName: 'CommentsListWithParentMetadata',
    fetchPolicy: 'cache-and-network',
    limit: 10
  });
  
  const commentKarmaPreviews = comments ? _.sortBy(comments, contentSort) : []
  const postKarmaPreviews = posts ? _.sortBy(posts, contentSort) : []
  
  const { MetaInfo, FormatDate, SunshineUserMessages, CommentKarmaWithPreview, PostKarmaWithPreview, LWTooltip, UsersNameWrapper, Loading, SunshineNewUserPostsList, SunshineNewUserCommentsList } = Components
  
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

  const basicInfoRow = <div>
    <div>
      <Link className={classes.displayName} to={userGetProfileUrl(user)}>
        {user.displayName} 
      </Link>
      {(user.postCount > 0 && !user.reviewedByUserId) && <DescriptionIcon className={classes.icon}/>}
      {user.sunshineFlagged && <FlagIcon className={classes.icon}/>}
    </div>

    <div className={classes.row}>
      <MetaInfo className={classes.info}>
        { user.karma || 0 }
      </MetaInfo>
      <MetaInfo className={classes.info}>
        <FormatDate date={user.createdAt}/>
      </MetaInfo>
    </div>
    <div>{user.email}</div>


  </div>

  const moderatorActionLogRow = <div>
    {user.moderatorActions
      .filter(moderatorAction => moderatorAction.active)
      .map(moderatorAction => <div key={`${user._id}_${moderatorAction.type}`}>{MODERATOR_ACTION_TYPES[moderatorAction.type]}</div>)
    }
  </div>

  const moderatorNotesColumn = <div className={classes.notes}>
    <Input
      value={notes}
      fullWidth
      onChange={e => setNotes(e.target.value)}
      onClick={e => handleClick()}
      disableUnderline
      placeholder="Notes for other moderators"
      multiline
      rowsMax={5}
    />
  </div>

  const moderatorActionsRow = <div className={classes.row}>
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
      <LWTooltip title={`${mostRecentRateLimit?.active ? "Un-rate-limit" : "Rate-limit"} this user's ability to post and comment`}>
        <div className={classNames(classes.permissionsButton, {[classes.permissionDisabled]: !!mostRecentRateLimit?.active})}onClick={handleRateLimit}>
          {MODERATOR_ACTION_TYPES[RATE_LIMIT_ONE_PER_DAY]}
        </div>
      </LWTooltip>
    </div>

  const votesRow = <div className={classes.votesRow}>
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

  const postCommentSortingRow = <div>
    Sort by: <span className={classNames(classes.sortButton, {[classes.sortSelected]: contentSort === "baseScore"})} onClick={() => setContentSort("baseScore")}>
        karma
      </span>
    <span className={classNames(classes.sortButton, {[classes.sortSelected]: contentSort === "postedAt"})} onClick={() => setContentSort("postedAt")}>
        postedAt
      </span>
  </div>

  const postSummaryRow = <div className={classes.contentSummaryRow}>
    <LWTooltip title="Post count">
        <span>
          { user.postCount || 0 }
          <DescriptionIcon className={classes.hoverPostIcon}/>
        </span>
    </LWTooltip>
    {postKarmaPreviews.map(post => <PostKarmaWithPreview key={post._id} post={post}/>)}
    { hiddenPostCount ? <span> ({hiddenPostCount} deleted)</span> : null}
  </div>

  const commentSummaryRow = <div className={classes.contentSummaryRow}>
    <LWTooltip title="Comment count">
      { user.commentCount || 0 }
    </LWTooltip>
    <MessageIcon className={classes.icon}/>
    {commentKarmaPreviews.map(comment => <CommentKarmaWithPreview key={comment._id} comment={comment}/>)}
    { hiddenCommentCount ? <span> ({hiddenCommentCount} deleted)</span> : null}
  </div>
  
  return (
    <div className={classes.root}>
      <div className={classes.columns}>
        <div className={classes.infoColumn}>
          {basicInfoRow}
          {moderatorNotesColumn}
          <div>
            {moderatorActionLogRow}
            {user.reviewedAt
              ? <div className={classes.reviewedAt}>Reviewed <FormatDate date={user.reviewedAt}/> ago by <UsersNameWrapper documentId={user.reviewedByUserId}/></div>
              : null 
            }
            {user.banned
              ? <p><em>Banned until <FormatDate date={user.banned}/></em></p>
              : null 
            }
          </div>
        </div>
        <div className={classes.contentColumn}>
          <div dangerouslySetInnerHTML={{__html: user.htmlBio}} className={classes.bio}/>
          {user.website && <div>Website: <a href={`https://${user.website}`} target="_blank" rel="noopener noreferrer" className={classes.website}>{user.website}</a></div>}
          {votesRow}
          {postCommentSortingRow}
          {postSummaryRow}
          {(commentsLoading || postsLoading) && <Loading/>}
          {commentSummaryRow}
          <div className={classNames(classes.content, {[classes.contentCollapsed]: !contentExpanded})}>
            <SunshineNewUserPostsList posts={posts} user={user}/>
            <SunshineNewUserCommentsList comments={comments} user={user}/>
          </div>
          <a className={classes.expandButton} onClick={() => setContentExpanded(!contentExpanded)}>{contentExpanded ? "Collapse" : "Expand"}</a>
        </div>
        <div className={classes.actionsColumn}>
          {moderatorActionsRow}
          {permissionsRow}
          <SunshineUserMessages user={user}/>
        </div>
      </div>
    </div>
  )
}

const UsersReviewInfoCardComponent = registerComponent('UsersReviewInfoCard', UsersReviewInfoCard, {
  styles,
  hocs: [
    withErrorBoundary,
  ],
});

declare global {
  interface ComponentTypes {
    UsersReviewInfoCard: typeof UsersReviewInfoCardComponent
  }
}


