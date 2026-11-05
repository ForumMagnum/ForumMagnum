import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import FormatDate from '@/components/common/FormatDate';
import { useCurrentTime } from '@/lib/utils/TimeProvider';
import type { TeamInboxThread } from './teamInboxThreads';

const styles = defineStyles('TeamInboxThreadItem', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 20px',
    borderBottom: theme.palette.border.faint,
    cursor: 'pointer',
    transition: 'background-color 0.1s ease',
    '&:hover': {
      backgroundColor: theme.palette.grey[50],
    },
    ...theme.typography.commentStyle,
    overflow: 'hidden',
    minWidth: 0,
  },
  done: {
    '& $participants': {
      color: theme.palette.grey[600],
      fontWeight: 400,
    },
  },
  focused: {
    borderLeft: `3px solid ${theme.palette.primary.main}`,
    paddingLeft: 17,
    backgroundColor: theme.palette.grey[100],
  },
  participants: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: 500,
    color: theme.palette.grey[900],
    marginRight: 12,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  tag: {
    fontSize: 11,
    padding: '1px 6px',
    marginRight: 8,
    whiteSpace: 'nowrap',
    backgroundColor: theme.palette.greyAlpha(0.08),
    color: theme.palette.greyAlpha(0.6),
  },
  appealTag: {
    backgroundColor: theme.palette.background.primaryTranslucent,
    color: theme.palette.primary.main,
  },
  date: {
    fontSize: 13,
    color: theme.palette.grey[600],
    width: 24,
    marginRight: 12,
    textAlign: 'center',
    flexShrink: 0,
  },
  waitingOverdue: {
    color: theme.palette.error.main,
  },
}));

const TeamInboxThreadItem = ({ thread, isDone, isFocused, onFocus }: {
  thread: TeamInboxThread;
  isDone: boolean;
  isFocused: boolean;
  onFocus: () => void;
}) => {
  const classes = useStyles(styles);
  const now = useCurrentTime();
  const { conversation, appeal } = thread;
  const participantNames = conversation.participants?.map(participant => participant.displayName).join(', ');
  const waitingDays = !isDone && conversation.moderatorReplyWaitingSince
    ? (now.getTime() - new Date(conversation.moderatorReplyWaitingSince).getTime()) / (24 * 60 * 60 * 1000)
    : 0;

  return (
    <div className={classNames(classes.root, { [classes.focused]: isFocused, [classes.done]: isDone })} onClick={onFocus}>
      <div className={classNames(classes.date, {
        [classes.waitingOverdue]: waitingDays > 4,
      })}>
        {!isDone && conversation.moderatorReplyWaitingSince
          ? <FormatDate
              date={conversation.moderatorReplyWaitingSince}
              tooltip="Time waiting for a reply, measured from the first unanswered user message."
            />
          : '—'}
      </div>
      <div className={classes.participants} title={participantNames}>
        {participantNames}
      </div>
      {appeal && <span className={classNames(classes.tag, classes.appealTag)}>Appeal {appeal.status}</span>}
      {conversation.awaitingModeratorReply && <span className={classes.tag}>Awaiting reply</span>}
    </div>
  );
};

export default TeamInboxThreadItem;
