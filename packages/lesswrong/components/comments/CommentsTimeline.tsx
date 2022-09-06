import { Components, registerComponent } from '../../lib/vulcan-lib';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import withErrorBoundary from '../common/withErrorBoundary';
import type { CommentTreeNode } from '../../lib/utils/unflatten';
import type { CommentTreeOptions } from './commentTree';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  button: {
    color: theme.palette.lwTertiary.main
  },
  nestedScroll: {
    overflowY: 'scroll',
  }
})

const CommentsTimelineFn = ({
  treeOptions,
  comments,
  commentCount,
  loadMoreCount = 10,
  totalComments = 0,
  loadMoreComments,
  loadingMoreComments,
  startThreadTruncated=true,
  parentAnswerId,
  defaultNestingLevel = 1,
  parentCommentId,
  forceSingleLine,
  forceNotSingleLine,
  classes,
}: {
  treeOptions: CommentTreeOptions;
  comments: Array<CommentTreeNode<CommentsList>>;
  commentCount: number;
  loadMoreCount: number,
  totalComments: number,
  loadMoreComments: any,
  loadingMoreComments: boolean,
  startThreadTruncated?: boolean;
  parentAnswerId?: string;
  defaultNestingLevel?: number;
  parentCommentId?: string;
  forceSingleLine?: boolean;
  forceNotSingleLine?: boolean;
  classes: ClassesType;
}) => {
  const bodyRef = useRef<HTMLDivElement|null>(null);
  const [userHasScrolled, setUserHasScrolled] = useState(false);

  // Scroll to the bottom when the page loads
  const currentHeight = bodyRef.current?.clientHeight;
  useEffect(() => {
    if (!userHasScrolled && bodyRef.current)
      bodyRef.current?.scrollTo(0, bodyRef.current.scrollHeight);
  }, [currentHeight, userHasScrolled])

  const { CommentsNode } = Components;

  const handleScroll = (e) => {
    const isAtBottom = Math.abs((e.target.scrollHeight - e.target.scrollTop) - e.target.clientHeight) < 10;

    // If we are not at the bottom that means the user has scrolled up,
    // in which case never autoscroll to the bottom again
    if (!isAtBottom)
      setUserHasScrolled(true);

    // Start loading more when we are less than 1 page from the top
    if (!loadingMoreComments && commentCount < totalComments && e.target.scrollTop < e.target.clientHeight)
      loadMoreComments(commentCount + loadMoreCount);
  }

  const commentsToRender = useMemo(() => comments.reverse(), [comments]);

  if (!comments) {
    return (
      <div>
        <p>No comments to display.</p>
      </div>
    );
  }

  return (
    <Components.ErrorBoundary>
      <div className={classes.nestedScroll} ref={bodyRef} onScroll={handleScroll}>
        {loadingMoreComments ? <Components.Loading /> : <></>}
        {commentsToRender.map((comment) => (
          <CommentsNode
            treeOptions={treeOptions}
            startThreadTruncated={startThreadTruncated}
            comment={comment.item}
            childComments={comment.children}
            key={comment.item._id}
            parentCommentId={parentCommentId}
            parentAnswerId={parentAnswerId}
            forceSingleLine={forceSingleLine}
            forceNotSingleLine={forceNotSingleLine}
            shortform={(treeOptions.post as PostsBase)?.shortform}
            isChild={defaultNestingLevel > 1}
            enableGuidelines={false}
            displayMode={"minimalist"}
          />
        ))}
      </div>
    </Components.ErrorBoundary>
  );
};


const CommentsTimelineComponent = registerComponent('CommentsTimeline', CommentsTimelineFn, {
  styles, hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    CommentsTimeline: typeof CommentsTimelineComponent,
  }
}

