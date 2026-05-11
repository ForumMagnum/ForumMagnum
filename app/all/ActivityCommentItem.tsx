"use client";

import React from 'react';
import { commentGetPageUrl } from '@/lib/collections/comments/helpers';
import ActivityRow from './ActivityRow';
import ActivitySummaryRow from './ActivitySummaryRow';
import ActivityExpandedSection from './ActivityExpandedSection';
import ActivityExpandedBody from './ActivityExpandedBody';
import ActivityCommentParents from './ActivityCommentParents';
import CommentSummaryContent from './CommentSummaryContent';
import { useExpandable } from './useExpandable';

interface ActivityCommentItemProps {
  comment: CommentsListWithParentMetadata;
  postedAt: Date;
  baseScore: number;
  compact: boolean;
}

const ActivityCommentItem = ({comment, postedAt, baseScore, compact}: ActivityCommentItemProps) => {
  const { expanded, toggle } = useExpandable();
  return (
    <ActivityRow expanded={expanded}>
      {expanded && comment.parentCommentId && <ActivityCommentParents parentCommentId={comment.parentCommentId} />}
      <ActivitySummaryRow baseScore={baseScore} user={comment.user} postedAt={postedAt} expanded={expanded} onToggle={toggle}>
        <CommentSummaryContent comment={comment} expanded={expanded} compact={compact} />
      </ActivitySummaryRow>
      {expanded && (
        <ActivityExpandedSection permalinkUrl={commentGetPageUrl(comment)} permalinkLabel="View comment →">
          <ActivityExpandedBody
            html={comment.contents?.html ?? ''}
            contentType="comment"
            description={`comment ${comment._id}`}
            emptyText="(empty comment)"
          />
        </ActivityExpandedSection>
      )}
    </ActivityRow>
  );
};

export default ActivityCommentItem;
