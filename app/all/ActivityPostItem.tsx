"use client";

import React from 'react';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import ActivityRow from './ActivityRow';
import ActivitySummaryRow from './ActivitySummaryRow';
import ActivityExpandedSection from './ActivityExpandedSection';
import ActivityExpandedBody from './ActivityExpandedBody';
import PostSummaryContent from './PostSummaryContent';

interface ActivityPostItemProps {
  post: PostsList;
  postedAt: Date;
  baseScore: number;
  compact: boolean;
  expanded: boolean;
  onToggle: () => void;
}

const ActivityPostItem = ({post, postedAt, baseScore, compact, expanded, onToggle}: ActivityPostItemProps) => {
  return (
    <ActivityRow expanded={expanded} compact={compact} onToggle={onToggle}>
      <ActivitySummaryRow baseScore={baseScore} user={post.user} postedAt={postedAt} expanded={expanded} onToggle={onToggle} isPost>
        <PostSummaryContent post={post} expanded={expanded} compact={compact} />
      </ActivitySummaryRow>
      {expanded && (
        <ActivityExpandedSection permalinkUrl={postGetPageUrl(post)} permalinkLabel="Read full post →">
          <ActivityExpandedBody
            html={post.contents?.htmlHighlight ?? ''}
            contentType="postHighlight"
            description={`post ${post._id}`}
            emptyText="No preview available for this post."
          />
        </ActivityExpandedSection>
      )}
    </ActivityRow>
  );
};

export default ActivityPostItem;
