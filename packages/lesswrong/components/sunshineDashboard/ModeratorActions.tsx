import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import DoneIcon from '@material-ui/icons/Done';
import SnoozeIcon from '@material-ui/icons/Snooze';
import AddAlarmIcon from '@material-ui/icons/AddAlarm';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import OutlinedFlagIcon from '@material-ui/icons/OutlinedFlag';
import classNames from 'classnames';
import { useUpdate } from '../../lib/crud/withUpdate';
import { useCreate } from '../../lib/crud/withCreate';
import moment from 'moment';
import { RATE_LIMIT_ONE_PER_DAY } from '../../lib/collections/moderatorActions/schema';
import FlagIcon from '@material-ui/icons/Flag';

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  }
});

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

export const ModeratorActions = ({classes, user, currentUser, refetch, setNotes, }: {
  user: SunshineUsersList,
  classes: ClassesType,
  currentUser: UsersCurrent,
  refetch: () => void
}) => {
  const { LWTooltip } = Components

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

  const canReview = !!(user.maxCommentCount || user.maxPostCount)

  const getTodayString = () => {
    const today = new Date();
    return today.toLocaleString('default', { month: 'short', day: 'numeric'});
  }

  const signature = `${currentUser?.displayName}, ${getTodayString()}`
  const signatureWithNote = (note:string) => {
    return `${signature}: ${note}\n`
  }

  const handleReview = () => {
    if (canReview) {
      void updateUser({
        selector: {_id: user._id},
        data: {
          sunshineFlagged: false,
          reviewedByUserId: currentUser._id,
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

  return <div className={classes.row}>
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
}

const ModeratorActionsComponent = registerComponent('ModeratorActions', ModeratorActions, {styles});

declare global {
  interface ComponentTypes {
    ModeratorActions: typeof ModeratorActionsComponent
  }
}

