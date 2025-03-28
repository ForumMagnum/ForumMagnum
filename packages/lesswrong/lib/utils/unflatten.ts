import keyBy from 'lodash/keyBy';

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
  const commentTreeNodes: CommentTreeNode<T>[] = comments.map(comment => ({ item:comment, children:[] }))
  const commentTreeNodesById = keyBy(commentTreeNodes, c=>c.item._id);
  const roots: CommentTreeNode<T>[] = [];
  
  for (const commentNode of commentTreeNodes) {
    const parentId = commentNode.item.parentCommentId;
    if (parentId) {
      const parentNode = commentTreeNodesById[parentId]
      if (parentNode) {
        parentNode.children.push(commentNode);
      } else {
        roots.push(commentNode);
      }
    } else {
      roots.push(commentNode);
    }
  }
  return roots;
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
