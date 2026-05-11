"use client";

import React from 'react';
import { useQuery } from '@/lib/crud/useQuery';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import SingleLineComment from '@/components/comments/SingleLineComment';
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
    marginLeft: 42,
    marginBottom: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
}));

interface ActivityCommentParentsProps {
  parentCommentId: string;
}

const ActivityCommentParents = ({parentCommentId}: ActivityCommentParentsProps) => {
  const classes = useStyles(styles);
  const { data } = useQuery(ActivityCommentParentsQuery, {
    variables: { commentId: parentCommentId },
  });
  const ancestors = flattenAncestorChain(data?.comment?.result);
  if (ancestors.length === 0) return null;
  return (
    <div className={classes.parentList}>
      {ancestors.map(ancestor => (
        <SingleLineComment
          key={ancestor._id}
          comment={ancestor}
          treeOptions={{}}
          nestingLevel={1}
        />
      ))}
    </div>
  );
};

export default ActivityCommentParents;
