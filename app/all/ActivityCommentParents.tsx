"use client";

import React from 'react';
import { useQuery } from '@/lib/crud/useQuery';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ActivityRowSingleLineComment from './ActivityRowSingleLineComment';
import { ActivityCommentParentsQuery } from './queries';

// Recursive shape for the chain returned by ActivityCommentParentsQuery. Each
// level contains all CommentsList fields plus an optional `parentComment` that
// is itself the same shape, terminating when we hit the bottom of the recursion
// (or run past the depth fetched by the query).
interface ParentChainComment extends CommentsList {
  parentComment?: ParentChainComment | null;
}

// Walk up the parent chain starting from the immediate parent and produce a
// flat list ordered from the top-most ancestor down to the immediate parent.
function flattenAncestorChain(top: ParentChainComment | null | undefined): CommentsList[] {
  const ancestors: CommentsList[] = [];
  let current: ParentChainComment | null | undefined = top;
  while (current) {
    ancestors.unshift(current);
    current = current.parentComment ?? null;
  }
  return ancestors;
}

const styles = defineStyles('ActivityCommentParents', (theme: ThemeType) => ({
  parentList: {
    marginBottom: 2,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  '@keyframes activityCommentParentsPulse': {
    '0%, 100%': { opacity: 0.5 },
    '50%': { opacity: 0.85 },
  },
  placeholder: {
    height: 24,
    borderRadius: 3,
    background: theme.palette.panelBackground.singleLineComment,
    animation: '$activityCommentParentsPulse 1.4s ease-in-out infinite',
  },
}));

interface ActivityCommentParentsProps {
  parentCommentId: string; 
}

const ActivityCommentParents = ({parentCommentId}: ActivityCommentParentsProps) => {
  const classes = useStyles(styles);
  const { data, loading } = useQuery(ActivityCommentParentsQuery, {
    variables: { commentId: parentCommentId },
  });
  const ancestors = flattenAncestorChain(data?.comment?.result);
  if (ancestors.length === 0) {
    if (!loading) return null;
    return (
      <div className={classes.parentList}>
        <div className={classes.placeholder} />
      </div>
    );
  }
  return (
    <div className={classes.parentList}>
      {ancestors.map(ancestor => (
        <ActivityRowSingleLineComment key={ancestor._id} comment={ancestor} />
      ))}
    </div>
  );
};

export default ActivityCommentParents;
