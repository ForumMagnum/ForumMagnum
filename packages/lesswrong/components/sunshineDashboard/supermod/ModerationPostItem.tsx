import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import FormatDate from '@/components/common/FormatDate';
import { htmlToTextDefault } from '@/lib/htmlToText';

const styles = defineStyles('ModerationPostItem', (theme: ThemeType) => ({
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
  },
  displayName: {
    fontSize: 15,
    fontWeight: 500,
    color: theme.palette.grey[900],
    marginRight: 12,
    width: 120,
    minWidth: 100,
    maxWidth: 120,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  karma: {
    fontSize: 13,
    marginRight: 8,
    minWidth: 28,
    textAlign: 'right',
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
  postedAt: {
    fontSize: 13,
    color: theme.palette.grey[600],
    marginRight: 12,
    width: 24,
    flexShrink: 0,
  },
  contentInfo: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    marginRight: 12,
  },
  postTitle: {
    fontSize: 14,
    fontWeight: 500,
    color: theme.palette.grey[900],
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginBottom: 4,
  },
  postContents: {
    fontSize: 13,
    color: theme.palette.grey[600],
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}));

const ModerationPostItem = ({
  post,
  isFocused,
  onFocus,
}: {
  post: SunshinePostsList;
  isFocused: boolean;
  onFocus: () => void;
}) => {
  const classes = useStyles(styles);

  const karma = post.baseScore;
  const karmaClass = karma < 0 ? classes.karmaNegative : karma < 10 ? classes.karmaLow : classes.karmaPositive;

  const contentPreview = htmlToTextDefault(post.contents?.html ?? '');

  return (
    <div
      className={classNames(classes.root, {
        [classes.focused]: isFocused,
      })}
      onClick={onFocus}
    >
      <div className={classes.displayName}>
        {post.user?.displayName ?? 'Unknown'}
      </div>
      <div className={classNames(classes.karma, karmaClass)}>
        {karma}
      </div>
      <div className={classes.postedAt}>
        <FormatDate date={post.postedAt} />
      </div>
      <div className={classes.contentInfo}>
        <div className={classes.postTitle}>
          {post.title}
        </div>
        {contentPreview && (
          <div className={classes.postContents}>
            {contentPreview}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModerationPostItem;

