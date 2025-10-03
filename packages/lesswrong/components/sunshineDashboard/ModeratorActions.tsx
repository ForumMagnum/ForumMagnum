import React, { useEffect, useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import DoneIcon from '@/lib/vendor/@material-ui/icons/src/Done';
import SnoozeIcon from '@/lib/vendor/@material-ui/icons/src/Snooze';
import AddAlarmIcon from '@/lib/vendor/@material-ui/icons/src/AddAlarm';
import AlarmOffIcon from '@/lib/vendor/@material-ui/icons/src/AlarmOff';
import DeleteForeverIcon from '@/lib/vendor/@material-ui/icons/src/DeleteForever';
import RemoveCircleOutlineIcon from '@/lib/vendor/@material-ui/icons/src/RemoveCircleOutline';
import VisibilityOutlinedIcon from '@/lib/vendor/@material-ui/icons/src/VisibilityOutlined';
import ReportProblemIcon from '@/lib/vendor/@material-ui/icons/src/ReportProblem';
import OutlinedFlagIcon from '@/lib/vendor/@material-ui/icons/src/OutlinedFlag';
import classNames from 'classnames';
import moment from 'moment';
import FlagIcon from '@/lib/vendor/@material-ui/icons/src/Flag';
import Input from '@/lib/vendor/@material-ui/core/src/Input';
import { getCurrentContentCount, UserContentCountPartial } from '../../lib/collections/moderatorActions/helpers';
import { hideScrollBars } from '../../themes/styleUtils';
import { getSignature, getSignatureWithNote } from '../../lib/collections/users/helpers';
import { hideUnreviewedAuthorCommentsSettings } from '@/lib/instanceSettings';
import { useDialog } from '../common/withDialog';
import NewModeratorActionDialog from "./NewModeratorActionDialog";
import LWTooltip from "../common/LWTooltip";
import ModeratorActionItem from "./ModeratorUserInfo/ModeratorActionItem";
import { MenuItem } from "../common/Menus";
import UserRateLimitItem from "./UserRateLimitItem";
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";

const SunshineUsersListUpdateMutation = gql(`
  mutation updateUserModeratorActions($selector: SelectorInput!, $data: UpdateUserDataInput!) {
    updateUser(selector: $selector, data: $data) {
      data {
        ...SunshineUsersList
      }
    }
  }
`);

const styles = (theme: ThemeType) => ({
  row: {
    display: "flex",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8
  },
  modButton:{
    marginTop: 6,
    marginRight: 16,
    cursor: "pointer",
    '&:hover': {
      opacity: .5
    }
  },
  warningButton: {
    color: theme.palette.error.light,
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
    cursor: "pointer",
    whiteSpace: "nowrap",
    marginRight: 8
  },
  permissionDisabled: {
    border: "none"
  },
  disabledButton: {
    opacity: .5,
    cursor: "default"
  },
  notes: {
    border: theme.palette.border.faint,
    borderRadius: 2,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 4,
    paddingBottom: 4,
    marginTop: 8,
    marginBottom: 8,
    ...hideScrollBars,
    '& *': {
      ...hideScrollBars
    }
  },
});

export function getNewSnoozeUntilContentCount(user: UserContentCountPartial, contentCount: number) {
  return getCurrentContentCount(user) + contentCount
}

export const ModeratorActions = ({classes, user, currentUser, refetch, comments, posts}: {
  user: SunshineUsersList,
  classes: ClassesType<typeof styles>,
  currentUser: UsersCurrent,
  refetch: () => void,
  comments: Array<CommentsListWithParentMetadata>|undefined,
  posts: Array<SunshinePostsList>|undefined,
}) => {
  const [notes, setNotes] = useState(user.sunshineNotes || "")
  const { openDialog } = useDialog();

  const [updateUser] = useMutation(SunshineUsersListUpdateMutation);

  const signature = getSignature(currentUser.displayName);

  const getModSignatureWithNote = (note: string) => getSignatureWithNote(currentUser.displayName, note);
  
  const handleNotes = () => {
    if (notes !== user.sunshineNotes) {
      void updateUser({
        variables: {
          selector: { _id: user._id },
          data: {
            sunshineNotes: notes
          }
        }
      })
    }
  }

  useEffect(() => {
    return () => {
      handleNotes();
    }
  });

  const signAndDate = (sunshineNotes: string) => {
    if (!sunshineNotes.match(signature)) {
      const padding = !sunshineNotes ? ": " : ": \n\n"
      return signature + padding + sunshineNotes
    }
    return sunshineNotes
  }
  
  const handleClick = () => {
    const signedNotes = signAndDate(notes)
    if (signedNotes !== notes) {
      setNotes(signedNotes)
    }
  }
  const handleReview = () => {
    const newNotes = getModSignatureWithNote(`Approved`)+notes;
    void updateUser({
      variables: {
        selector: { _id: user._id },
        data: {
          sunshineFlagged: false,
          reviewedByUserId: currentUser._id,
          reviewedAt: new Date(),
          needsReview: false,
          sunshineNotes: newNotes,
          snoozedUntilContentCount: null
        }
      }
    })
    setNotes( newNotes )
  }
  
  const handleSnooze = (contentCount: number) => {
    const newNotes = getModSignatureWithNote(`Snooze ${contentCount}`)+notes;
    void updateUser({
      variables: {
        selector: { _id: user._id },
        data: {
          needsReview: false,
          reviewedAt: new Date(),
          reviewedByUserId: currentUser!._id,
          sunshineNotes: newNotes,
          snoozedUntilContentCount: getNewSnoozeUntilContentCount(user, contentCount)
        }
      }
    })
    setNotes( newNotes )
  }
  
  const handleNeedsReview = () => {
    if (user.needsReview) return null;
    const newNotes = getModSignatureWithNote("set to manual review") + notes;
    void updateUser({
      variables: {
        selector: { _id: user._id },
        data: {
          needsReview: true,
          sunshineNotes: newNotes
        }
      }
    })    
    setNotes( newNotes )
  }

  const handleRemoveNeedsReview = () => {
    const newNotes = getModSignatureWithNote("removed from review queue without snooze/approval") + notes;
    void updateUser({
      variables: {
        selector: { _id: user._id },
        data: {
          needsReview: false,
          // this is necessary so that their next post/comment won't appear without being approved by a moderator
          reviewedByUserId: null,
          /* 
           * this is necessary so it shows up that they appear in the "recently reviewed" list
           * for users who've been reviewed before, we update the date.  for users we haven't, we don't.
           * see comment in `getReasonForReview` for more details
           */
          reviewedAt: user.reviewedAt ? new Date() : null,
          sunshineNotes: newNotes
        }
      }
    })    
    setNotes( newNotes )
  }

  const banMonths = 3
  
  const handleBan = () => {
    const newNotes = getModSignatureWithNote("Ban") + notes;
    if (confirm(`Ban this user for ${banMonths} months?`)) {
      void updateUser({
        variables: {
          selector: { _id: user._id },
          data: {
            sunshineFlagged: false,
            reviewedByUserId: currentUser!._id,
            needsReview: false,
            reviewedAt: new Date(),
            banned: moment().add(banMonths, 'months').toDate(),
            sunshineNotes: newNotes
          }
        }
      })
      setNotes( newNotes )
    }
  }
  
  const handlePurge = () => {
    const newNotes = getModSignatureWithNote("Purge") + notes;
    if (confirm("Are you sure you want to delete all this user's posts, comments, sequences, and votes?")) {
      void updateUser({
        variables: {
          selector: { _id: user._id },
          data: {
            sunshineFlagged: false,
            reviewedByUserId: currentUser!._id,
            nullifyVotes: true,
            deleteContent: true,
            needsReview: false,
            reviewedAt: new Date(),
            banned: moment().add(1000, 'years').toDate(),
            sunshineNotes: newNotes
          }
        }
      })
      setNotes( newNotes )
    }
  }
  
  const handleFlag = () => {
    const flagStatus = user.sunshineFlagged ? "Unflag" : "Flag"
    const newNotes =  getModSignatureWithNote(flagStatus)+notes
    void updateUser({
      variables: {
        selector: { _id: user._id },
        data: {
          sunshineFlagged: !user.sunshineFlagged,
          sunshineNotes: newNotes
        }
      }
    })
    setNotes(newNotes)
  }
  
  const handleDisablePosting = () => {
    const abled = user.postingDisabled ? 'enabled' : 'disabled';
    const newNotes = getModSignatureWithNote(`publishing posts ${abled}`) + notes;
    void updateUser({
      variables: {
        selector: { _id: user._id },
        data: {
          postingDisabled: !user.postingDisabled,
          sunshineNotes: newNotes
        }
      }
    })
    setNotes( newNotes )
  }
  
  const handleDisableAllCommenting = () => {
    const abled = user.allCommentingDisabled ? 'enabled' : 'disabled';
    const newNotes = getModSignatureWithNote(`all commenting ${abled}`) + notes;
    void updateUser({
      variables: {
        selector: { _id: user._id },
        data: {
          allCommentingDisabled: !user.allCommentingDisabled,
          sunshineNotes: newNotes
        }
      }
    })
    setNotes( newNotes )
  }
  
  const handleDisableCommentingOnOtherUsers = () => {
    const abled = user.commentingOnOtherUsersDisabled ? 'enabled' : 'disabled'
    const newNotes = getModSignatureWithNote(`all commenting on others' content ${abled}`) + notes;
    void updateUser({
      variables: {
        selector: { _id: user._id },
        data: {
          commentingOnOtherUsersDisabled: !user.commentingOnOtherUsersDisabled,
          sunshineNotes: newNotes
        }
      }
    })
    setNotes( newNotes )
  }
  
  const handleDisableConversations = () => {
    const abled = user.conversationsDisabled ? 'enabled' : 'disabled'
    const newNotes = getModSignatureWithNote(`conversations ${abled}`) + notes;
    void updateUser({
      variables: {
        selector: { _id: user._id },
        data: {
          conversationsDisabled: !user.conversationsDisabled,
          sunshineNotes: newNotes
        }
      }
    })
    setNotes( newNotes )
  }

  const userCommentsWarning = user.commentCount && hideUnreviewedAuthorCommentsSettings.get();

  const actionRow = <div className={classes.row}>
    <LWTooltip title="Snooze and Approve 10 (Appear in sidebar after 10 posts and/or comments. User's future posts are autoapproved)" placement="top">
      <AddAlarmIcon className={classNames(classes.snooze10, classes.modButton)} onClick={() => handleSnooze(10)}/>
    </LWTooltip>
    <LWTooltip title="Snooze and Approve 1 (Appear in sidebar on next post or comment. User's future posts are autoapproved)" placement="top">
      <SnoozeIcon className={classes.modButton} onClick={() => handleSnooze(1)}/>
    </LWTooltip>
    <LWTooltip
      title={`${userCommentsWarning ? "Warning: user has made a comment! " : ""}Remove from queue (i.e. snooze without approving posts)`}
    >
      <AlarmOffIcon className={classNames(classes.modButton, {
        [classes.warningButton]: userCommentsWarning,
      })} onClick={handleRemoveNeedsReview}/>
    </LWTooltip>
    <LWTooltip title="Approve" placement="top">
      <DoneIcon onClick={handleReview} className={classes.modButton}/>
    </LWTooltip>
    <LWTooltip title="Ban for 3 months" placement="top">
      <RemoveCircleOutlineIcon className={classes.modButton} onClick={handleBan} />
    </LWTooltip>
    <LWTooltip title="Purge (delete and ban)" placement="top">
      <DeleteForeverIcon className={classes.modButton} onClick={handlePurge} />
    </LWTooltip>
    <LWTooltip title={user.sunshineFlagged ? "Unflag this user" : <div>
      <div>Flag this user for more in-depth review</div>
      <div><em>(This will not remove them from sidebar)</em></div>
    </div>} placement="top">
      <div onClick={handleFlag} className={classes.modButton} >
        {user.sunshineFlagged ? <FlagIcon /> : <OutlinedFlagIcon />}
      </div>
    </LWTooltip>
    <LWTooltip title="Return this user to the review queue">
      <VisibilityOutlinedIcon className={classNames(classes.modButton, {[classes.disabledButton]: user.needsReview})} onClick={handleNeedsReview}/>
    </LWTooltip>
    <LWTooltip title="Create a new moderator action for this user">
      <ReportProblemIcon className={classes.modButton} onClick={() => openDialog({
        name: 'NewModeratorActionDialog',
        contents: ({onClose}) => <NewModeratorActionDialog
          onClose={onClose}
          userId={user._id}
        />
      })}/>
    </LWTooltip>
  </div>

  const permissionsRow = <div className={classes.row}>
    <LWTooltip title={`${user.postingDisabled ? "Enable" : "Disable"} this user's ability to create posts`}>
      <div className={classNames(classes.permissionsButton, {[classes.permissionDisabled]: user.postingDisabled})} onClick={handleDisablePosting}>
        Posts
      </div>
    </LWTooltip>
    <LWTooltip title={`${user.allCommentingDisabled ? "Enable" : "Disable"} this user's to comment (including their own quick takes)`}>
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
  
  return <div>
    {actionRow}
    {permissionsRow}
    <UserRateLimitItem userId={user._id} />
    <div className={classes.notes}>
      <Input
        value={notes}
        fullWidth
        onChange={e => setNotes(e.target.value)}
        onClick={e => handleClick()}
        onBlur={handleNotes}
        disableUnderline
        placeholder="Notes for other moderators"
        multiline
        rows={10}
      />
    </div>
      <div>
      {user.moderatorActions
        ?.filter(moderatorAction => moderatorAction.active)
        .map(moderatorAction => <ModeratorActionItem 
            key={moderatorAction._id} 
            moderatorAction={moderatorAction}
            user={user} 
            posts={posts} 
            comments={comments}
          />
        )
      }
    </div>
  </div>
}

export default registerComponent('ModeratorActions', ModeratorActions, {styles});



