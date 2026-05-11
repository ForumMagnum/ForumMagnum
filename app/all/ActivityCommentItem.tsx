"use client";

import React from 'react';
import { commentGetPageUrl } from '@/lib/collections/comments/helpers';
import ActivityRow from './ActivityRow';
import ActivitySummaryRow from './ActivitySummaryRow';
import ActivityExpandedSection from './ActivityExpandedSection';
import ActivityExpandedBody from './ActivityExpandedBody';
import CommentSummaryContent from './CommentSummaryContent';
import { useExpandable } from './useExpandable';

interface ActivityCommentItemProps {
  comment: CommentsListWithParentMetadata;
  postedAt: Date;
  baseScore: number;
}

const ActivityCommentItem = ({comment, postedAt, baseScore}: ActivityCommentItemProps) => {
  const { expanded, toggle } = useExpandable();
  return (
    <ActivityRow expanded={expanded}>
      <ActivitySummaryRow baseScore={baseScore} user={comment.user} postedAt={postedAt} expanded={expanded} onToggle={toggle}>
        <CommentSummaryContent comment={comment} />
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
