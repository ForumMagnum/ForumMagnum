import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import FormatDate from '@/components/common/FormatDate';

const styles = defineStyles('ModerationTagItem', (theme: ThemeType) => ({
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
  postCount: {
    fontSize: 13,
    color: theme.palette.grey[600],
    marginRight: 12,
    minWidth: 28,
    textAlign: 'right',
    flexShrink: 0,
  },
  contentInfo: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    marginRight: 12,
  },
  tagName: {
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
  date: {
    fontSize: 13,
    color: theme.palette.grey[600],
    width: 24,
    textAlign: 'center',
    flexShrink: 0,
  },
}));

const ModerationTagItem = ({
  tag,
  isFocused,
  onFocus,
}: {
  tag: SunshineTagFragment;
  isFocused: boolean;
  onFocus: () => void;
}) => {
  const classes = useStyles(styles);

  return (
    <div
      className={classNames(classes.root, {
        [classes.focused]: isFocused,
      })}
      onClick={onFocus}
    >
      <div className={classes.displayName}>
        {tag.user?.displayName ?? 'Unknown'}
      </div>
      <div className={classes.postCount} title="Posts with this wikitag">
        {tag.postCount}
      </div>
      <div className={classes.contentInfo}>
        <div className={classes.tagName}>
          {tag.name}
        </div>
        {tag.description?.plaintextDescription && (
          <div className={classes.description}>
            {tag.description.plaintextDescription}
          </div>
        )}
      </div>
      <div className={classes.date}>
        <FormatDate date={tag.createdAt} />
      </div>
    </div>
  );
};

export default ModerationTagItem;
