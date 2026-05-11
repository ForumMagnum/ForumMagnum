"use client";

import React from 'react';
import { commentGetPageUrl } from '@/lib/collections/comments/helpers';
import ActivityRow from './ActivityRow';
import ActivitySummaryRow from './ActivitySummaryRow';
import ActivityExpandedSection from './ActivityExpandedSection';
import ActivityExpandedBody from './ActivityExpandedBody';
import ActivityCommentParents from './ActivityCommentParents';
import CommentSummaryContent from './CommentSummaryContent';

interface ActivityCommentItemProps {
  comment: CommentsListWithParentMetadata;
  postedAt: Date;
  baseScore: number;
  compact: boolean;
  expanded: boolean;
  onToggle: () => void;
}

const ActivityCommentItem = ({comment, postedAt, baseScore, compact, expanded, onToggle}: ActivityCommentItemProps) => {
  return (
    <ActivityRow expanded={expanded} compact={compact} onToggle={onToggle}>
      <ActivitySummaryRow baseScore={baseScore} user={comment.user} postedAt={postedAt} expanded={expanded} onToggle={onToggle}>
        <CommentSummaryContent comment={comment} expanded={expanded} compact={compact} />
      </ActivitySummaryRow>
      {expanded && comment.parentCommentId && <ActivityCommentParents parentCommentId={comment.parentCommentId} />}
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
