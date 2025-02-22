import { Comments } from '../../lib/collections/comments/collection';
import * as _ from 'underscore';

// Return the IDs of all ancestors of the given comment (not including the provided
// comment itself).
export const getCommentAncestorIds = async (comment: DbComment): Promise<string[]> => {
  const ancestorIds: string[] = [];
  
  let currentComment: DbComment|null = comment;
  while (currentComment?.parentCommentId) {
    currentComment = await Comments.findOne({_id: currentComment.parentCommentId});
    if (currentComment) {
      if (ancestorIds.includes(currentComment._id)) {
        throw new Error("Parent-comment reference cycle detected starting from "+comment._id);
      }
      ancestorIds.push(currentComment._id);
    }
  }
  
  return ancestorIds;
}

// Return all comments in a subtree, given its root.
export const getCommentSubtree = async (rootComment: DbComment, projection?: any): Promise<DbComment[]> => {
  const comments: DbComment[] = [rootComment];
  let visited = new Set<string>();
  let unvisited: string[] = [rootComment._id];
  
  while(unvisited.length > 0) {
    const childComments = await Comments.find({parentCommentId: {$in: unvisited}}, projection).fetch();
    for (let commentId of unvisited)
      visited.add(commentId);
    unvisited = [];
    
    for (let childComment of childComments) {
      if (!visited.has(childComment._id)) {
        comments.push(childComment);
        unvisited.push(childComment._id);
      }
    }
  }
  
  return comments;
}
