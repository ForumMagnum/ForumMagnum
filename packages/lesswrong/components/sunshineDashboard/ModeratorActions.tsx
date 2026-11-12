import { useForumType } from '@/components/hooks/useForumType';
import React, { useEffect, useRef, useState } from 'react';
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
import { getSignature } from '../../lib/collections/users/helpers';
import { hideUnreviewedAuthorCommentsSettings } from '@/lib/instanceSettings';
import { useDialog } from '../common/withDialog';
import NewModeratorActionDialog from "./NewModeratorActionDialog";
import LWTooltip from "../common/LWTooltip";
import ModeratorActionItem from "./ModeratorUserInfo/ModeratorActionItem";
import UserRateLimitItem from "./UserRateLimitItem";
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";
import { MANUAL_NEEDS_REVIEW } from '@/lib/collections/moderatorActions/constants';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { useStabilizedCallback } from '@/components/hooks/useDebouncedCallback';
import { getOptimisticNotes, useAddModeratorNote } from './useAddModeratorNote';

const SunshineUsersListUpdateMutation = gql(`
  mutation updateUserModeratorActions($selector: SelectorInput!, $data: UpdateUserDataInput!) {
    updateUser(selector: $selector, data: $data) {
      data {
        ...SunshineUsersList
      }
    }
  }
`);

const ModeratorActionsCreateMutation = gql(`
  mutation createModeratorAction($data: CreateModeratorActionDataInput!) {
    createModeratorAction(data: $data) {
      data {
        ...ModeratorActionDisplay
      }
    }
  }
`);

const styles = defineStyles('ModeratorActions', (theme: ThemeType) => ({
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
}));

export function getNewSnoozeUntilContentCount(user: UserContentCountPartial, contentCount: number) {
  return getCurrentContentCount(user) + contentCount
}

export const ModeratorActions = ({user, currentUser, refetch, comments, posts}: {
  user: SunshineUsersList,
  currentUser: UsersCurrent,
  refetch: () => void,
  comments: Array<CommentsListWithParentMetadata>|undefined,
  posts: Array<SunshinePostsList>|undefined,
}) => {
  const { forumType } = useForumType();
  const classes = useStyles(styles);
  const [notes, setNotes] = useState(user.sunshineNotes || "")
  // Only the moderator's own edits to the textarea are saved as the whole notes;
  // notes from the action buttons are added by the server.
  const notesEdited = useRef(false);
  const pendingNotesSave = useRef<Promise<unknown>>(Promise.resolve());
  const { openDialog } = useDialog();

  const [updateUser] = useMutation(SunshineUsersListUpdateMutation);
  const [createModeratorAction] = useMutation(ModeratorActionsCreateMutation);
  const addModeratorNote = useAddModeratorNote();

  const signature = getSignature(currentUser.displayName);

  const handleNotes = () => {
    if (!notesEdited.current) return;
    notesEdited.current = false;
    if (notes !== user.sunshineNotes) {
      pendingNotesSave.current = updateUser({
        variables: {
          selector: { _id: user._id },
          data: {
            sunshineNotes: notes
          }
        }
      })
    }
  }

  const saveEditedNotes = useStabilizedCallback<void, void>(handleNotes);
  useEffect(() => {
    return () => {
      saveEditedNotes();
    }
  }, [saveEditedNotes]);

  const updateUserWithNote = async (data: UpdateUserDataInput, note: string) => {
    if (!notesEdited.current) {
      setNotes(getOptimisticNotes(notes, currentUser.displayName, note))
    }
    // Let a save of the textarea land (or fail) first, so it can't overwrite this note
    await pendingNotesSave.current.catch(() => {});
    await updateUser({
      variables: {
        selector: { _id: user._id },
        data
      }
    })
    const updatedUser = await addModeratorNote(user._id, note);
    if (updatedUser && !notesEdited.current) {
      setNotes(updatedUser.sunshineNotes || "")
    }
  }

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
      notesEdited.current = true;
      setNotes(signedNotes)
    }
  }
  const handleReview = () => {
    void updateUserWithNote({
      sunshineFlagged: false,
      reviewedByUserId: currentUser._id,
      reviewedAt: new Date(),
      needsReview: false,
      snoozedUntilContentCount: null,
    }, `Approved`)
  }
  
  const handleSnooze = (contentCount: number) => {
    void updateUserWithNote({
      needsReview: false,
      reviewedAt: new Date(),
      reviewedByUserId: currentUser!._id,
      snoozedUntilContentCount: getNewSnoozeUntilContentCount(user, contentCount),
    }, `Snooze ${contentCount}`)
  }
  
  const handleNeedsReview = () => {
    if (user.needsReview) return null;
    void createModeratorAction({
      variables: {
        data: {
          type: MANUAL_NEEDS_REVIEW,
          userId: user._id,
        }
      }
    }).then(() => refetch());
  }

  const handleRemoveNeedsReview = () => {
    void updateUserWithNote({
      needsReview: false,
      // this is necessary so that their next post/comment won't appear without being approved by a moderator
      reviewedByUserId: null,
      /* 
       * this is necessary so it shows up that they appear in the "recently reviewed" list
       * for users who've been reviewed before, we update the date.  for users we haven't, we don't.
       * see comment in `getReasonForReview` for more details
       */
      reviewedAt: user.reviewedAt ? new Date() : null,
    }, "removed from review queue without snooze/approval")
  }

  const banMonths = 3
  
  const handleBan = () => {
    if (confirm(`Ban this user for ${banMonths} months?`)) {
      void updateUserWithNote({
        sunshineFlagged: false,
        reviewedByUserId: currentUser!._id,
        needsReview: false,
        reviewedAt: new Date(),
        banned: moment().add(banMonths, 'months').toDate(),
      }, "Ban")
    }
  }
  
  const handlePurge = () => {
    if (confirm("Are you sure you want to delete all this user's posts, comments, sequences, and votes?")) {
      void updateUserWithNote({
        sunshineFlagged: false,
        reviewedByUserId: currentUser!._id,
        nullifyVotes: true,
        deleteContent: true,
        needsReview: false,
        reviewedAt: new Date(),
        banned: moment().add(1000, 'years').toDate(),
      }, "Purge")
    }
  }
  
  const handleFlag = () => {
    const flagStatus = user.sunshineFlagged ? "Unflag" : "Flag"
    void updateUserWithNote({
      sunshineFlagged: !user.sunshineFlagged,
    }, flagStatus)
  }
  
  const handleDisablePosting = () => {
    const abled = user.postingDisabled ? 'enabled' : 'disabled';
    void updateUserWithNote({
      postingDisabled: !user.postingDisabled,
    }, `publishing posts ${abled}`)
  }
  
  const handleDisableAllCommenting = () => {
    const abled = user.allCommentingDisabled ? 'enabled' : 'disabled';
    void updateUserWithNote({
      allCommentingDisabled: !user.allCommentingDisabled,
    }, `all commenting ${abled}`)
  }
  
  const handleDisableCommentingOnOtherUsers = () => {
    const abled = user.commentingOnOtherUsersDisabled ? 'enabled' : 'disabled'
    void updateUserWithNote({
      commentingOnOtherUsersDisabled: !user.commentingOnOtherUsersDisabled,
    }, `all commenting on others' content ${abled}`)
  }
  
  const handleDisableConversations = () => {
    const abled = user.conversationsDisabled ? 'enabled' : 'disabled'
    void updateUserWithNote({
      conversationsDisabled: !user.conversationsDisabled,
    }, `conversations ${abled}`)
  }

  const userCommentsWarning = user.commentCount && hideUnreviewedAuthorCommentsSettings.get(forumType);

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
        onChange={e => {
          notesEdited.current = true;
          setNotes(e.target.value)
        }}
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

export default ModeratorActions;



