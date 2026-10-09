import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import FormatDate from '@/components/common/FormatDate';
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
  focused: {
    borderLeft: `3px solid ${theme.palette.primary.main}`,
    paddingLeft: 17,
    backgroundColor: theme.palette.grey[100],
  },
  participants: {
    fontSize: 15,
    fontWeight: 500,
    color: theme.palette.grey[900],
    marginRight: 12,
    width: 160,
    flexShrink: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    color: theme.palette.grey[800],
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginRight: 12,
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
    textAlign: 'center',
    flexShrink: 0,
  },
}));

const TeamInboxThreadItem = ({ thread, isFocused, onFocus }: {
  thread: TeamInboxThread;
  isFocused: boolean;
  onFocus: () => void;
}) => {
  const classes = useStyles(styles);
  const { conversation, appeal } = thread;

  return (
    <div className={classNames(classes.root, { [classes.focused]: isFocused })} onClick={onFocus}>
      <div className={classes.participants}>
        {conversation.participants?.map(participant => participant.displayName).join(', ')}
      </div>
      <div className={classes.title}>
        {conversation.title}
      </div>
      {appeal && <span className={classNames(classes.tag, classes.appealTag)}>Appeal {appeal.resolvedAt ? appeal.status : "open"}</span>}
      {conversation.awaitingModeratorReply && <span className={classes.tag}>Awaiting reply</span>}
      <div className={classes.date}>
        {conversation.latestActivity && <FormatDate date={conversation.latestActivity} />}
      </div>
    </div>
  );
};

export default TeamInboxThreadItem;
