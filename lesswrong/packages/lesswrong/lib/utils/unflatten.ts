import * as _ from 'underscore';

export interface ThreadableCommentType {
  _id: string
  parentCommentId?: string | null
  topLevelCommentId?: string | null
}
export interface CommentTreeNode<T extends ThreadableCommentType> {
  item: T,
  children: Array<CommentTreeNode<T>>
}

// Given a set of comments with `parentCommentId`s in them, restructure as a
// tree. Do this in a functional way: rather than edit a children property into
// the existing comments (which requires cloning), like Vulcan-Starter does,
// wrap the comments in an object with `item` and `children` fields. This
// avoids cloning the comment object, which is good because the clone messes
// with React's ability to detect whether updates are needed.
export function unflattenComments<T extends ThreadableCommentType>(comments: Array<T>): Array<CommentTreeNode<T>>
{
  const resultsRestructured = _.map(comments, (comment: T): CommentTreeNode<T> => { return { item:comment, children:[] }});
  return unflattenCommentsRec(resultsRestructured);
}

export function addGapIndicators<T extends ThreadableCommentType>(comments: Array<CommentTreeNode<T>>): Array<CommentTreeNode<T & {gapIndicator?: boolean}>> {
  // Sometimes (such as /shortform page), a comment tree is rendered where some comments are not the direct descendant of the previous comment. 
  // This function adds extra, empty comment nodes to make this UI more visually clear
  return comments.map((node: CommentTreeNode<T>): CommentTreeNode<T & {gapIndicator?: boolean}> => {
    if (node?.item?.parentCommentId !== node?.item?.topLevelCommentId) {
      return {item: {...node.item, gapIndicator: true}, children: node.children}
    }
    return node
  })
}

// Recursive portion of unflattenComments. Produced by incremental modification
// of Vulcan's Utils.unflatten.
function unflattenCommentsRec<T extends ThreadableCommentType>(array: Array<CommentTreeNode<T>>, parent?: CommentTreeNode<T>): Array<CommentTreeNode<T>>
{
  let tree: Array<CommentTreeNode<T>> = [];

  let children: Array<CommentTreeNode<T>> = [];

  if (typeof parent === "undefined") {
    let commentDict: Partial<Record<string,boolean>> = {}
    array.forEach((node) => {
      commentDict[node.item._id] = true
    })
    // if there is no parent, we're at the root level
    // so we return all root nodes (i.e. nodes with no parent)
    children = _.filter(array, (node: CommentTreeNode<T>) => (!node.item.parentCommentId || !commentDict[node.item.parentCommentId]));
  } else {
    // if there *is* a parent, we return all its child nodes
    // (i.e. nodes whose parentId is equal to the parent's id.)
    children = _.filter(array, (node: CommentTreeNode<T>) => node.item.parentCommentId === parent.item._id);
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

export function flattenCommentBranch<T extends ThreadableCommentType>(branch: CommentTreeNode<T>): T[] {
  return [branch.item, ...branch.children.flatMap(flattenCommentBranch)];
}
