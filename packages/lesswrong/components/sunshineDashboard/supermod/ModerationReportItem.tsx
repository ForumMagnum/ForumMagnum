import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import FormatDate from '@/components/common/FormatDate';
import { getReportSubject } from './reports';

const styles = defineStyles('ModerationReportItem', (theme: ThemeType) => ({
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
    paddingLeft: 17, // 20 - 3 to account for border
    backgroundColor: theme.palette.grey[100],
  },
  displayName: {
    fontSize: 15,
    fontWeight: 500,
    color: theme.palette.grey[900],
    marginRight: 12,
    width: 120,
    flexShrink: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  contentInfo: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    marginRight: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: 500,
    color: theme.palette.grey[900],
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: theme.palette.grey[600],
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
  spamTag: {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.contrastText,
  },
  date: {
    fontSize: 13,
    color: theme.palette.grey[600],
    width: 24,
    textAlign: 'center',
    flexShrink: 0,
  },
}));

const ModerationReportItem = ({
  report,
  isFocused,
  onFocus,
}: {
  report: UnclaimedReportsList;
  isFocused: boolean;
  onFocus: () => void;
}) => {
  const classes = useStyles(styles);
  const subject = getReportSubject(report);

  return (
    <div
      className={classNames(classes.root, {
        [classes.focused]: isFocused,
      })}
      onClick={onFocus}
    >
      <div className={classes.displayName}>
        {subject.author?.displayName ?? 'Unknown'}
      </div>
      <div className={classes.contentInfo}>
        <div className={classes.title}>
          {subject.title}
        </div>
        <div className={classes.description}>
          {report.description ? `"${report.description}"` : 'No reason given'} – {report.user?.displayName ?? 'Unknown'}
        </div>
      </div>
      {report.reportedAsSpam && <span className={classNames(classes.tag, classes.spamTag)}>Spam</span>}
      <span className={classes.tag}>{subject.kind}</span>
      <div className={classes.date}>
        <FormatDate date={report.createdAt} />
      </div>
    </div>
  );
};

export default ModerationReportItem;
