import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import FormatDate from '@/components/common/FormatDate';

const styles = defineStyles('CurationPostItem', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 20px',
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
  karma: {
    fontSize: 13,
    marginRight: 16,
    minWidth: 30,
    textAlign: 'center',
    flexShrink: 0,
  },
  karmaPositive: {
    color: theme.palette.primary.main,
  },
  karmaNegative: {
    color: theme.palette.error.main,
  },
  karmaLow: {
    color: theme.palette.grey[600],
  },
  postTitle: {
    fontSize: 14,
    fontWeight: 500,
    color: theme.palette.grey[900],
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginRight: 16,
    minWidth: 0,
  },
  displayName: {
    fontSize: 13,
    color: theme.palette.grey[500],
    maxWidth: 120,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textAlign: 'right',
    marginLeft: "auto",
    flex: 1,
  },
  postedAt: {
    fontSize: 13,
    color: theme.palette.grey[600],
    width: 24,
    textAlign: 'center',
    flexShrink: 0,
  },
  tags: {
    display: 'flex',
    gap: 4,
    flexShrink: 0,
    flexWrap: 'wrap',
    marginLeft: 8,
    marginRight: 8,
  },
  curatorTag: {
    fontSize: 11,
    padding: '1px 6px',
    backgroundColor: 'light-dark(#e8f5e9, #1b5e20)',
    color: 'light-dark(#2e7d32, #a5d6a7)',
    whiteSpace: 'nowrap',
  },
  suggesterTag: {
    fontSize: 11,
    padding: '1px 6px',
    backgroundColor: theme.palette.greyAlpha(0.08),
    color: theme.palette.greyAlpha(0.6),
    whiteSpace: 'nowrap',
  },
}));

const CurationPostItem = ({post, isFocused, onFocus}: {
  post: SunshineCurationPostsList;
  isFocused: boolean;
  onFocus: () => void;
}) => {
  const classes = useStyles(styles);
  const karma = post.baseScore;
  const karmaClass = karma < 0 ? classes.karmaNegative : karma < 10 ? classes.karmaLow : classes.karmaPositive;

  const curationNotices = post.curationNotices ?? [];
  const suggesterNames = post.suggestForCuratedUsernames?.split(',').map(s => s.trim()).filter(Boolean) ?? [];

  return (
    <div
      className={classNames(classes.root, { [classes.focused]: isFocused })}
      onClick={onFocus}
    >
      <div className={classNames(classes.karma, karmaClass)}>
        {karma}
      </div>
      <div className={classes.postTitle}>
        {post.title}
      </div>
      <div className={classes.displayName}>
        {post.user?.displayName ?? 'Unknown'}
      </div>
      <div className={classes.tags}>
        {curationNotices.map(notice => (
          <span key={notice._id} className={classes.curatorTag}>
            {notice.user?.displayName ?? 'Curator'}
          </span>
        ))}
        {suggesterNames.map(name => (
          <span key={name} className={classes.suggesterTag}>
            {name}
          </span>
        ))}
      </div>
      <div className={classes.postedAt}>
        <FormatDate date={post.postedAt} />
      </div>
    </div>
  );
};

export default CurationPostItem;
