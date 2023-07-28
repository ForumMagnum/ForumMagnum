import keyBy from 'lodash/keyBy';

interface ThreadableCommentType {
  _id: string
  parentCommentId: string|null
  topLevelCommentId: string
}
export interface CommentTreeNode<T extends ThreadableCommentType> {
  _id: string
  item: T|null,
  children: Array<CommentTreeNode<T>>
}

type UnflattenOptions = {
  usePlaceholders?: boolean
};

// Given a set of comments with `parentCommentId`s in them, restructure as a
// tree. Do this in a functional way: rather than edit a children property into
// the existing comments (which requires cloning), like Vulcan-Starter does,
// wrap the comments in an object with `item` and `children` fields. This
// avoids cloning the comment object, which is good because the clone messes
// with React's ability to detect whether updates are needed.
//
// If the comments are a subset of the comments on a post rather than the
// complete set, there may be implied comments that aren't loaded, which are
// ancestors of comments that are. In that case, nodes appear in the tree with
// `item:null`, representing the fact that there exists a comment there but it
// isn't loaded.
export function unflattenComments<T extends ThreadableCommentType>(comments: Array<T>, options: UnflattenOptions={}): Array<CommentTreeNode<T>>
{
  const usedCommentIds = new Set<string>();
  
  // Convert comments into (disconnected) tree nodes
  const resultsRestructured = comments.map((comment:T): CommentTreeNode<T> => {
    usedCommentIds.add(comment._id);
    return { _id: comment._id, item:comment, children:[] }
  });
  
  function addVirtualComment(id: string) {
    if (!usedCommentIds.has(id)) {
      usedCommentIds.add(id);
      resultsRestructured.push({
        _id: id,
        item: null,
        children: []
      });
    }
  }
  
  // Check if any of the comments mention a parentCommentId or topLevelCommentId
  // that wasn't in the set; if so, add a tree node for those.
  if (options.usePlaceholders) {
    for (let comment of comments) {
      if (comment.parentCommentId && !usedCommentIds.has(comment.parentCommentId)) {
        addVirtualComment(comment.parentCommentId);
      }
      if (comment.topLevelCommentId && !usedCommentIds.has(comment.topLevelCommentId)) {
        addVirtualComment(comment.topLevelCommentId);
      }
    }
  }
  
  let resultsById = keyBy(resultsRestructured, r=>r._id);
  let nonRootCommentIds = new Set<string>();
  
  for (let result of resultsRestructured) {
    if (result.item) {
      if (result.item.parentCommentId) {
        const parent = resultsById[result.item.parentCommentId]
        if (parent) {
          parent.children.push(result);
          nonRootCommentIds.add(result._id);

          // If the parent is an unloaded comment, we can infer that the parent
          // is a descendent of the same top-level comment as we are
          if (!parent.item) {
            const topLevelComment = resultsById[result.item.topLevelCommentId];
            if (parent._id != topLevelComment._id) {
              nonRootCommentIds.add(parent._id);
              if (!topLevelComment.children.some(c=>c._id===parent._id)) {
                topLevelComment.children.push(parent);
              }
            }
          }
        }
      }
    }
  }
  
  let rootComments: Array<CommentTreeNode<T>> = [];
  for (let result of resultsRestructured) {
    if (!nonRootCommentIds.has(result._id)) {
      rootComments.push(result);
    }
  }
  return rootComments;
}

export function commentTreesEqual<Fragment extends ThreadableCommentType>(a: Array<CommentTreeNode<Fragment>>, b: Array<CommentTreeNode<Fragment>>) {
  if (!!a !== !!b) return false;
  if (!a && !b) return true;
  if (a.length !== b.length) return false;
  
  for (let i=0; i<a.length; i++) {
    if (a[i].item !== b[i].item)
      return false;
    if (!commentTreesEqual(a[i].children, b[i].children))
      return false;
  }
  return true;
}

export function countCommentsInTree<T extends ThreadableCommentType>(tree: CommentTreeNode<T>[]): number {
  let sum = tree.length;
  for (let node of tree) {
    sum += countCommentsInTree(node.children);
  }
  return sum;
}
