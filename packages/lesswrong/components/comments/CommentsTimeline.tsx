import { Components, registerComponent } from '../../lib/vulcan-lib';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import withErrorBoundary from '../common/withErrorBoundary';
import type { CommentTreeNode } from '../../lib/utils/unflatten';
import type { CommentTreeOptions } from './commentTree';
import { CommentFormDisplayMode } from './CommentsNewForm';

const styles = (theme: ThemeType): JssStyles => ({
  button: {
    color: theme.palette.lwTertiary.main
  },
  nestedScroll: {
    overflowY: 'scroll',
    marginTop: 'auto',
    padding: '0px 10px',
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
  comments: CommentWithRepliesFragment[];
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

  const { CommentWithReplies, Typography } = Components;

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

  const commentsToRender = useMemo(() => comments.slice().reverse(), [comments]);

  if (!comments) {
    return (
      <Typography variant="body1">
        <p>No comments to display.</p>
      </Typography>
    );
  }
  
  const passThroughProps = {
    treeOptions: treeOptions,
    refetch: treeOptions.refetch,
    startThreadTruncated: startThreadTruncated,
    parentCommentId: parentCommentId,
    parentAnswerId: parentAnswerId,
    forceSingleLine: forceSingleLine,
    forceNotSingleLine: forceNotSingleLine,
    shortform: (treeOptions.post as PostsBase)?.shortform,
    isChild: defaultNestingLevel > 1,
    enableGuidelines: false,
    displayMode: "minimalist" as CommentFormDisplayMode,
  }

  return (
    <Components.ErrorBoundary>
      <div className={classes.nestedScroll} ref={bodyRef} onScroll={handleScroll}>
        {loadingMoreComments ? <Components.Loading /> : <></>}
        {commentsToRender.map((comment) => (
          <CommentWithReplies
            refetch={treeOptions.refetch}
            comment={comment}
            key={comment._id}
            passThroughProps={passThroughProps}
            initialMaxChildren={5}
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

