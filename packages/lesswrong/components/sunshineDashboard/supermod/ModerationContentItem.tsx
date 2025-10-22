import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import FormatDate from '@/components/common/FormatDate';
import DescriptionIcon from '@/lib/vendor/@material-ui/icons/src/Description';
import MessageIcon from '@/lib/vendor/@material-ui/icons/src/Message';
import { htmlToTextDefault } from '@/lib/htmlToText';
import { truncate } from '@/lib/editor/ellipsize';
import RejectContentButton from '../RejectContentButton';
import { getEnvKeystrokeText } from '@/lib/vendor/ckeditor5-util/keyboard';

const styles = defineStyles('ModerationContentItem', (theme: ThemeType) => ({
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
    backgroundColor: theme.palette.grey[50],
  },
  rejected: {
    backgroundColor: theme.palette.panelBackground.deletedComment,
    '&:hover': {
      backgroundColor: theme.palette.panelBackground.deletedComment,
    },
  },
  icon: {
    height: 14,
    width: 14,
    marginRight: 8,
    color: theme.palette.grey[500],
    flexShrink: 0,
  },
  karma: {
    fontSize: 13,
    marginRight: 12,
    minWidth: 32,
    textAlign: 'right',
    flexShrink: 0,
    fontWeight: 500,
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
    minWidth: 24,
    flexShrink: 0,
  },
  contentPreview: {
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
    marginBottom: 2,
  },
  text: {
    fontSize: 13,
    color: theme.palette.grey[600],
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  status: {
    fontSize: 11,
    padding: '2px 6px',
    borderRadius: 3,
    marginLeft: 8,
    textTransform: 'uppercase',
    fontWeight: 600,
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  reviewed: {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.dark,
  },
  rejectedStatus: {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.dark,
  },
  rejectButtonContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
    flexShrink: 0,
  },
  keystroke: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 18,
    height: 18,
    fontSize: 10,
    color: theme.palette.grey[600],
    fontFamily: theme.typography.fontFamily,
    backgroundColor: theme.palette.grey[100],
    borderRadius: 3,
    border: `1px solid ${theme.palette.grey[300]}`,
    padding: '0 4px',
  },
}));

type ContentItem = SunshinePostsList | CommentsListWithParentMetadata;

const isPost = (item: ContentItem): item is SunshinePostsList => {
  return 'title' in item && item.title !== null;
};

const ModerationContentItem = ({
  item,
  isFocused,
  onOpen,
}: {
  item: ContentItem;
  isFocused: boolean;
  onOpen: () => void;
}) => {
  const classes = useStyles(styles);

  const karma = item.baseScore ?? 0;
  const karmaClass = karma < 0 ? classes.karmaNegative : karma < 3 ? classes.karmaLow : classes.karmaPositive;

  const post = isPost(item);
  const contentHtml = item.contents?.html ?? '';
  const contentText = htmlToTextDefault(contentHtml);
  const truncatedText = truncate(contentText, 100, 'characters');

  const contentWrapper = post 
    ? { collectionName: 'Posts' as const, document: item }
    : { collectionName: 'Comments' as const, document: item };

  return (
    <div
      className={classNames(classes.root, {
        [classes.focused]: isFocused,
        [classes.rejected]: item.rejected,
      })}
      onClick={onOpen}
    >
      {post ? (
        <DescriptionIcon className={classes.icon} />
      ) : (
        <MessageIcon className={classes.icon} />
      )}
      
      <div className={classNames(classes.karma, karmaClass)}>
        {karma}
      </div>
      
      <div className={classes.postedAt}>
        <FormatDate date={item.postedAt} />
      </div>

      <div className={classes.contentPreview}>
        {post && (
          <div className={classes.title}>{item.title}</div>
        )}
        <div className={classes.text}>{truncatedText}</div>
      </div>

      {item.reviewedByUserId && (
        <div className={classNames(classes.status, classes.reviewed)}>
          Reviewed
        </div>
      )}
      
      {item.rejected && (
        <div className={classNames(classes.status, classes.rejectedStatus)}>
          Rejected
        </div>
      )}

      {!item.rejected && item.authorIsUnreviewed && (
        <div className={classes.rejectButtonContainer} onClick={(e) => e.stopPropagation()}>
          <RejectContentButton contentWrapper={contentWrapper} />
          <span className={classes.keystroke}>{getEnvKeystrokeText('R')}</span>
        </div>
      )}
    </div>
  );
};

export default ModerationContentItem;

