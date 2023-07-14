import map from 'lodash/map';
import keyBy from 'lodash/keyBy';
import some from 'lodash/some';

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
export function unflattenComments<T extends ThreadableCommentType>(comments: Array<T>): Array<CommentTreeNode<T>>
{
  const usedCommentIds = new Set<string>();
  
  // Convert comments into (disconnected) tree nodes
  const resultsRestructured = map(comments, (comment:T): CommentTreeNode<T> => {
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
  for (let comment of comments) {
    if (comment.parentCommentId && !usedCommentIds.has(comment.parentCommentId)) {
      addVirtualComment(comment.parentCommentId);
    }
    if (!usedCommentIds.has(comment.topLevelCommentId)) {
      addVirtualComment(comment.topLevelCommentId);
    }
  }
  
  let resultsById = keyBy(resultsRestructured, r=>r._id);
  let nonRootCommentIds = new Set<string>();
  
  for (let result of resultsRestructured) {
    if (result.item) {
      if (result.item.parentCommentId) {
        const parent = resultsById[result.item.parentCommentId]
        parent.children.push(result);
        nonRootCommentIds.add(result._id);
        
        // If the parent is an unloaded comment, we can infer that the parent
        // is a descendent of the same top-level comment as we are
        if (!parent.item) {
          const topLevelComment = resultsById[result.item.topLevelCommentId];
          if (parent._id != topLevelComment._id) {
            nonRootCommentIds.add(parent._id);
            if (!some(topLevelComment.children, c=>c._id===parent._id)) {
              topLevelComment.children.push(parent);
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

// Recursive portion of unflattenComments. Produced by incremental modification
// of Vulcan's Utils.unflatten.
/*function unflattenCommentsRec<T extends ThreadableCommentType>(array: Array<CommentTreeNode<T>>, parent?: CommentTreeNode<T>): Array<CommentTreeNode<T>>
{
  let tree: Array<CommentTreeNode<T>> = [];

  let children: Array<CommentTreeNode<T>> = [];

  if (typeof parent === "undefined") {
    let commentDict = new Set<string>();
    array.forEach((node) => {
      commentDict.add(node._id);
    })
    // if there is no parent, we're at the root level
    // so we return all root nodes (i.e. nodes with no parent)
    children = filter(array, (node:CommentTreeNode<T>) =>
      (node.item && (!node.item.parentCommentId || !commentDict.has(node.item.parentCommentId)))
    );
  } else {
    // if there *is* a parent, we return all its child nodes
    // (i.e. nodes whose parentId is equal to the parent's id.)
    children = filter(array, (node:CommentTreeNode<T>) =>
      node.item?.parentCommentId === parent._id
     );
  }

  // if we found children, we keep on iterating
  if (!!children.length) {

    if (typeof parent === "undefined") {
      // if we're at the root, then the tree consist of all root nodes
      tree = children;
    } else {
      // else, we add the children to the parent as the "childrenResults" property
      parent.children = children;
    }

    // we call the function on each child
    children.forEach(child => {
      unflattenCommentsRec(array, child);
    });
  }

  return tree;
}*/

/*export function addGapIndicators<T extends ThreadableCommentType>(comments: Array<CommentTreeNode<T>>): Array<CommentTreeNode<T & {gapIndicator?: boolean}>> {
  // Sometimes (such as /shortform page), a comment tree is rendered where some comments are not the direct descendant of the previous comment. 
  // This function adds extra, empty comment nodes to make this UI more visually clear
  return comments.map((node: CommentTreeNode<T>): CommentTreeNode<T & {gapIndicator?: boolean}> => {
    if (node?.item?.parentCommentId !== node?.item?.topLevelCommentId) {
      return {item: {...node.item, gapIndicator: true}, children: node.children}
    }
    return node
  })
}*/

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
