import { Components, registerComponent } from '../../lib/vulcan-lib';
import React, { useState } from 'react';
import { useOnSearchHotkey } from '../common/withGlobalKeydown';
import { Link } from '../../lib/reactRouterWrapper';
import { TRUNCATION_KARMA_THRESHOLD } from '../../lib/editor/ellipsize'
import { useCurrentUser } from '../common/withUser';
import withErrorBoundary from '../common/withErrorBoundary';
import type { CommentTreeNode } from '../../lib/utils/unflatten';
import type { CommentTreeOptions } from './commentTree';

const styles = (theme: ThemeType): JssStyles => ({
  button: {
    color: theme.palette.lwTertiary.main
  },
  commentsList: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 4,
    [theme.breakpoints.down('sm')]: {
      padding: 0,
    }
  }
})

export const POST_COMMENT_COUNT_TRUNCATE_THRESHOLD = 70

const CommentsListFn = ({treeOptions, comments, totalComments=0, startThreadTruncated, parentAnswerId, defaultNestingLevel=1, parentCommentId, classes}: {
  treeOptions: CommentTreeOptions,
  comments: Array<CommentTreeNode<CommentsList>>,
  totalComments?: number,
  startThreadTruncated?: boolean,
  parentAnswerId?: string,
  defaultNestingLevel?: number,
  parentCommentId?: string,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const [expandAllThreads,setExpandAllThreads] = useState(false);
  
  useOnSearchHotkey(() => setExpandAllThreads(true));

  const { CommentsNode, SettingsButton, CommentsListMeta, LoginPopupButton, LWTooltip } = Components
  
  const renderExpandOptions = () => {
    if  (totalComments > POST_COMMENT_COUNT_TRUNCATE_THRESHOLD) {
      const expandTooltip = `Posts with more than ${POST_COMMENT_COUNT_TRUNCATE_THRESHOLD} comments automatically truncate replies with less than ${TRUNCATION_KARMA_THRESHOLD} karma. Click or press ⌘F to expand all.`

      return <CommentsListMeta>
        <span>
          Some comments are truncated due to high volume. <LWTooltip title={expandTooltip}>
            <a className={!expandAllThreads && classes.button} onClick={()=>setExpandAllThreads(true)}>(⌘F to expand all)</a>
          </LWTooltip>
        </span>
        {currentUser 
          ? <LWTooltip title="Go to your settings page to update your Comment Truncation Options">
              <Link to="/account">
                <SettingsButton label="Change default truncation settings" />
              </Link>
            </LWTooltip>
          : <LoginPopupButton title={"Login to change default truncation settings"}>
              <SettingsButton label="Change truncation settings" />
            </LoginPopupButton>
        }
      </CommentsListMeta>
    }
  }

  if (!comments) {
    return <div>
      <p>No comments to display.</p>
    </div>
  }
  return <Components.ErrorBoundary>
    {renderExpandOptions()}
    {comments.length > 0 && <div className={classes.commentsList}>
      {comments.map(comment =>
        <CommentsNode
          treeOptions={treeOptions}
          startThreadTruncated={startThreadTruncated || totalComments >= POST_COMMENT_COUNT_TRUNCATE_THRESHOLD}
          expandAllThreads={expandAllThreads}
          comment={comment.item}
          childComments={comment.children}
          key={comment.item._id}
          parentCommentId={parentCommentId}
          parentAnswerId={parentAnswerId}
          shortform={(treeOptions.post as PostsBase)?.shortform}
          isChild={defaultNestingLevel > 1}
        />)
      }
    </div>}
  </Components.ErrorBoundary>
}


const CommentsListComponent = registerComponent('CommentsList', CommentsListFn, {
  styles, hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    CommentsList: typeof CommentsListComponent,
  }
}

