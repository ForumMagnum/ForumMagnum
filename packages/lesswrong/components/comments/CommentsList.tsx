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
})

export const POST_COMMENT_COUNT_TRUNCATE_THRESHOLD = 70

const CommentsListFn = ({treeOptions, comments, totalComments=0, startThreadTruncated, parentAnswerId, defaultNestingLevel=1, parentCommentId, forceSingleLine, forceNotSingleLine, topLevelComments, classes}: {
  treeOptions: CommentTreeOptions,
  comments: Array<CommentTreeNode<CommentsList>>,
  totalComments?: number,
  startThreadTruncated?: boolean,
  parentAnswerId?: string,
  defaultNestingLevel?: number,
  parentCommentId?: string,
  forceSingleLine?: boolean,
  forceNotSingleLine?: boolean,
  topLevelComments?: Array<CommentsList>,
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

  const topLevelCommentMappings = topLevelComments && Object.fromEntries(
    comments
      .map(({ item: { _id, topLevelCommentId } }) => [_id, topLevelCommentId] as const)
      .map(([_id, topLevelCommentId]) => [_id, topLevelComments.find(topLevelComment => topLevelComment._id === topLevelCommentId)] as const)
      .filter(([, topLevelComment]) => !!topLevelComment)
  );

  const commentNodes = comments.map(comment => {
    const rootCommentApproval = topLevelCommentMappings?.[comment.item._id]?.commentApproval;
    const updatedTreeOptions: CommentTreeOptions = {
      ...treeOptions,
      ...(rootCommentApproval ? { rootCommentApproval } : {})
    };

    return <CommentsNode
      treeOptions={updatedTreeOptions}
      startThreadTruncated={startThreadTruncated || totalComments >= POST_COMMENT_COUNT_TRUNCATE_THRESHOLD}
      expandAllThreads={expandAllThreads}
      comment={comment.item}
      childComments={comment.children}
      key={comment.item._id}
      parentCommentId={parentCommentId}
      parentAnswerId={parentAnswerId}
      forceSingleLine={forceSingleLine}
      forceNotSingleLine={forceNotSingleLine}
      shortform={(treeOptions.post as PostsBase)?.shortform}
      isChild={defaultNestingLevel > 1}
    />;
  });

  return <Components.ErrorBoundary>
    {renderExpandOptions()}
    <div>
      {commentNodes}
    </div>
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

