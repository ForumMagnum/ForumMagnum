import { registerComponent } from '../../lib/vulcan-lib/components';
import React, { useState } from 'react';
import { useOnSearchHotkey } from '../common/withGlobalKeydown';
import { Link } from '../../lib/reactRouterWrapper';
import { TRUNCATION_KARMA_THRESHOLD } from '../../lib/editor/ellipsize'
import { useCurrentUser } from '../common/withUser';
import withErrorBoundary from '../common/withErrorBoundary';
import type { CommentTreeNode } from '../../lib/utils/unflatten';
import type { CommentTreeOptions } from './commentTree';
import classNames from 'classnames';
import ErrorBoundary from "../common/ErrorBoundary";
import CommentsNodeInner from "./CommentsNode";
import SettingsButton from "../icons/SettingsButton";
import LoginPopupButton from "../users/LoginPopupButton";
import LWTooltip from "../common/LWTooltip";
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles("CommentsList", (theme: ThemeType) => ({
  button: {
    color: theme.palette.lwTertiary.main
  },
  commentsListLoadingSpacer: {
    minHeight: '100vh',
  },
  expandOptions: {
    fontSize: 14,
    clear: 'both',
    marginTop: 24,
    marginBottom: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: theme.palette.grey[600]
  },
  settingsLabel: {
    [theme.breakpoints.down('xs')]: {
      display: "none",
    },
  },
}))

export const POST_COMMENT_COUNT_TRUNCATE_THRESHOLD = 70

const CommentsListFn = ({treeOptions, comments, totalComments=0, startThreadTruncated, parentAnswerId, defaultNestingLevel=1, parentCommentId, loading}: {
  treeOptions: CommentTreeOptions,
  comments: Array<CommentTreeNode<CommentsList>>,
  totalComments?: number,
  startThreadTruncated?: boolean,
  parentAnswerId?: string,
  defaultNestingLevel?: number,
  parentCommentId?: string,
  loading?: boolean,
}) => {
  const classes = useStyles(styles);
  const [expandAllThreads,setExpandAllThreads] = useState(false);
  
  useOnSearchHotkey(() => setExpandAllThreads(true));
  const renderExpandOptions = () => {
    if  (totalComments > POST_COMMENT_COUNT_TRUNCATE_THRESHOLD) {
      const expandTooltip = `Posts with more than ${POST_COMMENT_COUNT_TRUNCATE_THRESHOLD} comments automatically truncate replies with less than ${TRUNCATION_KARMA_THRESHOLD} karma. Click or press ⌘F to expand all.`

      return <div className={classes.expandOptions}>
        <span>
          Some comments are truncated due to high volume. <LWTooltip title={expandTooltip}>
            <a className={!expandAllThreads ? classes.button : undefined} onClick={()=>setExpandAllThreads(true)}>(⌘F to expand all)</a>
          </LWTooltip>
        </span>
        <TruncationSettingsButton/>
      </div>
    }
  }

  if (!comments) {
    return <div>
      <p>No comments to display.</p>
    </div>
  }
  return <ErrorBoundary>
    {renderExpandOptions()}
    {/* commentsListLoadingSpacer makes the comments list keep a minimum height while reloading a different comment
        sorting view, so that the scroll position doesn't move. */}
    <div className={classNames({[classes.commentsListLoadingSpacer]: loading})}>
      {comments.map(comment =>
        <CommentsNodeInner
          treeOptions={treeOptions}
          startThreadTruncated={startThreadTruncated || totalComments >= POST_COMMENT_COUNT_TRUNCATE_THRESHOLD}
          expandAllThreads={expandAllThreads}
          comment={comment.item}
          childComments={comment.children}
          key={comment.item._id}
          parentCommentId={parentCommentId}
          parentAnswerId={parentAnswerId}
          shortform={(treeOptions.post as PostsBase)?.shortform}
          nestingLevel={defaultNestingLevel}
          isChild={defaultNestingLevel > 1}
        />)
      }
    </div>
  </ErrorBoundary>
}

const TruncationSettingsButton = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();

  return currentUser
    ? <LWTooltip title="Go to your settings page to update your Comment Truncation Options">
        <Link to="/account">
          <SettingsButton label={
            <span className={classes.settingsLabel}>
              Change default truncation settings
            </span>
          }/>
        </Link>
      </LWTooltip>
    : <LoginPopupButton title={"Login to change default truncation settings"}>
        <SettingsButton label={
          <span className={classes.settingsLabel}>
            Change truncation settings
          </span>
        }/>
      </LoginPopupButton>
}


export default registerComponent('CommentsList', CommentsListFn, {
  hocs: [withErrorBoundary],
  areEqual: "auto",
});



