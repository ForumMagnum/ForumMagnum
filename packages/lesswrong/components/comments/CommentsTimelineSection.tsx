import React, { useEffect, useRef, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { userIsAllowedToComment } from '../../lib/collections/users/helpers';
import { useCurrentUser } from '../common/withUser';
import type { CommentTreeNode } from '../../lib/utils/unflatten';
import classNames from 'classnames';
import * as _ from 'underscore';
import { NEW_COMMENT_MARGIN_BOTTOM } from './CommentsListSection';
import { TagCommentType } from '../../lib/collections/comments/schema';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    fontWeight: 400,
    margin: "0px auto -15px auto", // -15px is to offset the padding in Layout so that this fills exactly the whole page
    ...theme.typography.commentStyle,
    position: "relative",
    display: 'flex',
    flexDirection: 'column'
  },
  maxWidthRoot: {
    maxWidth: 720,
  },
  newComment: {
    border: theme.palette.border.commentBorder,
    borderWidth: 2,
    position: 'relative',
    borderRadius: 3,
    marginBottom: NEW_COMMENT_MARGIN_BOTTOM,
    marginTop: 30,
    marginLeft: 5,
    marginRight: 5,
    "@media print": {
      display: "none"
    },
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
  },
})

const CommentsTimelineSection = ({
  tag,
  commentCount,
  loadMoreCount = 10,
  totalComments,
  loadMoreComments,
  loadingMoreComments,
  comments,
  parentAnswerId,
  startThreadTruncated,
  newForm=true,
  refetch = () => {},
  classes,
}: {
  tag?: TagBasicInfo,
  commentCount: number,
  loadMoreCount: number,
  totalComments: number,
  loadMoreComments: any,
  loadingMoreComments: boolean,
  comments: CommentWithRepliesFragment[],
  parentAnswerId?: string,
  startThreadTruncated?: boolean,
  newForm: boolean,
  refetch?: any,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  
  const bodyRef = useRef<HTMLDivElement>(null)
  // topAbsolutePosition is set to make it exactly fill the page, 200 is about right so setting that as a default reduces the visual jitter
  const [topAbsolutePosition, setTopAbsolutePosition] = useState(200)
  
  useEffect(() => {
    recalculateTopAbsolutePosition()
    window.addEventListener('resize', recalculateTopAbsolutePosition)
    return () => window.removeEventListener('resize', recalculateTopAbsolutePosition)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  const recalculateTopAbsolutePosition = () => {
    if (bodyRef.current && bodyRef.current.getBoundingClientRect().top !== topAbsolutePosition)
      setTopAbsolutePosition(bodyRef.current.getBoundingClientRect().top)
  }

  return (
    <div
      ref={bodyRef}
      className={classNames(classes.root, { [classes.maxWidthRoot]: !tag})}
      style={{ height: `calc(100vh - ${topAbsolutePosition}px)` }}
    >
      <Components.CommentsTimeline
        treeOptions={{
          refetch,
          postPage: true,
          tag: tag,
        }}
        comments={comments}
        startThreadTruncated={startThreadTruncated}
        parentAnswerId={parentAnswerId}
        commentCount={commentCount}
        loadMoreCount={loadMoreCount}
        totalComments={totalComments}
        loadMoreComments={loadMoreComments}
        loadingMoreComments={loadingMoreComments}
      />
      {/* TODO add permissions check here */}
      {/* TODO add sorting here */}
      {newForm && (
        <div id="posts-thread-new-comment" className={classes.newComment}>
          <Components.CommentsNewForm
            tag={tag}
            tagCommentType={TagCommentType.Subforum}
            prefilledProps={{
              parentAnswerId: parentAnswerId,
            }}
            formProps={{
              editorHintText: `Message...`,
            }}
            successCallback={refetch}
            type="comment"
            enableGuidelines={false}
            displayMode="minimalist"
          />
        </div>
      )}
    </div>
  );
}

const CommentsTimelineSectionComponent = registerComponent("CommentsTimelineSection", CommentsTimelineSection, {styles});

declare global {
  interface ComponentTypes {
    CommentsTimelineSection: typeof CommentsTimelineSectionComponent,
  }
}

