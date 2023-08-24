import { useMemo } from "react";
import type { Comment } from "../types/CommentTypes";

export type DisplayComment = {
  comment: Comment,
  children: DisplayComment[],
}

const sortOldToNew = (a: Comment, b: Comment) => {
  const aPosted = Number(new Date(a.postedAt));
  const bPosted = Number(new Date(b.postedAt));
  return aPosted - bPosted;
}

const sortByScoreDesc = (a: DisplayComment, b: DisplayComment) =>
  b.comment.score - a.comment.score;

const buildDisplayComments = (comments: Comment[]): DisplayComment[] => {
  comments = [...comments].sort(sortOldToNew);

  const allComments: Record<string, DisplayComment> = {};
  const result: DisplayComment[] = [];

  for (const comment of comments) {
    if (comment.parentCommentId) {
      const displayComment = {comment, children: []};
      allComments[comment._id] = displayComment;
      allComments[comment.parentCommentId].children.push(displayComment);
    } else {
      const displayComment = {comment, children: []};
      allComments[comment._id] = displayComment;
      result.push(displayComment);
    }
  }

  return result.sort(sortByScoreDesc);
}

export const useDisplayComments = (comments: Comment[]) => {
  const displayComments = useMemo(() => {
    return buildDisplayComments(comments);
  }, [comments]);
  return displayComments;
}
