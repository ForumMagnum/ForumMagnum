import { Components, registerComponent } from '../../lib/vulcan-lib';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import withErrorBoundary from '../common/withErrorBoundary';
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
    if (!userHasScrolled && bodyRef.current) {
      bodyRef.current?.scrollTo(0, bodyRef.current.scrollHeight);

      // For mobile: scroll the entire page to the bottom to stop the address bar from
      // forcing the bottom off the end of the page. On desktop this just does nothing
      // because the page fills the screen exactly
      window.scrollTo({
        top: 500,
        // 'smooth' is to try and encourage it to scroll the address bar off the scree rather than overlaying it
        behavior: 'smooth'
      });
    }
  }, [currentHeight, userHasScrolled])

  const { CommentWithReplies, Typography } = Components;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const isAtBottom = Math.abs((e.currentTarget.scrollHeight - e.currentTarget.scrollTop) - e.currentTarget.clientHeight) < 10;

    // If we are not at the bottom that means the user has scrolled up,
    // in which case never autoscroll to the bottom again
    if (!isAtBottom)
      setUserHasScrolled(true);

    // Start loading more when we are less than 1 page from the top
    if (!loadingMoreComments && commentCount < totalComments && e.currentTarget.scrollTop < e.currentTarget.clientHeight)
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
  
  const commentNodeProps = {
    treeOptions: treeOptions,
    startThreadTruncated: startThreadTruncated,
    parentCommentId: parentCommentId,
    parentAnswerId: parentAnswerId,
    forceSingleLine: forceSingleLine,
    forceNotSingleLine: forceNotSingleLine,
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
            comment={comment}
            key={comment._id}
            commentNodeProps={commentNodeProps}
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

