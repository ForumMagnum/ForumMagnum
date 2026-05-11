"use client";

import React from 'react';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import ActivityRow from './ActivityRow';
import ActivitySummaryRow from './ActivitySummaryRow';
import ActivityExpandedSection from './ActivityExpandedSection';
import ActivityExpandedBody from './ActivityExpandedBody';
import PostSummaryContent from './PostSummaryContent';
import { useExpandable } from './useExpandable';

interface ActivityPostItemProps {
  post: PostsList;
  postedAt: Date;
  baseScore: number;
  compact: boolean;
}

const ActivityPostItem = ({post, postedAt, baseScore, compact}: ActivityPostItemProps) => {
  const { expanded, toggle } = useExpandable();
  return (
    <ActivityRow expanded={expanded}>
      <ActivitySummaryRow baseScore={baseScore} user={post.user} postedAt={postedAt} expanded={expanded} onToggle={toggle} isPost>
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
