import React, { createContext, useRef, useState, useCallback, useMemo } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { unflattenComments, CommentTreeNode } from '../../lib/utils/unflatten';
import { loadSingle } from '../../lib/crud/withSingle';
import type { CommentTreeOptions } from './commentTree';
import { useForceRerender } from '../hooks/useForceRerender';
import toDictionary from '../../lib/utils/toDictionary';
import keyBy from 'lodash/keyBy';
import filter from 'lodash/filter';
import orderBy from 'lodash/orderBy';
import take from 'lodash/take';
import mapValues from 'lodash/mapValues';
import { useApolloClient } from '@apollo/client/react/hooks';
import sumBy from 'lodash/sumBy';

export interface CommentPoolContextType {
  showMoreChildrenOf: (commentId: string)=>Promise<void>
  showParentOf: (commentId: string)=>Promise<void>
  showAncestorChain: (commentId: string)=>Promise<void>
  setExpansion: (commentId: string, newExpansionState: CommentExpansionState)=>Promise<void>
  invalidateComment: (commentId: string)=>Promise<void>
  addComment: (comment: CommentsList)=>Promise<void>
  getCommentState: (commentId: string) => SingleCommentState
}
export const CommentPoolContext = createContext<CommentPoolContextType|null>(null);
export type CommentExpansionState = "default"|"expanded"|"truncated"|"singleLine"|"singleLineGroupable"

interface SingleCommentState {
  comment: CommentsList
  visibility: "hidden"|"visible"
  expansion: CommentExpansionState
  rerender: (()=>void)|null
  
  /**
   * Used for storing comment-specific state in a way that will survive
   * reparenting. Accessed through CommentPoolContextType.getCommentState. See
   * useCommentState in CommentsNode.tsx.
   */
  otherState: Record<string,[any,(newValue:any)=>void]>
}
interface CommentPoolState {
  commentsSortOrder: string[]
  commentsById: Record<string,SingleCommentState>
}

/**
 * CommentPool: Given a set of initial comments, threads them, and provides
 * handling for Load More links that expand the set.
 *
 * Currently, there are tons of different entry points with their own handling
 * of comment loading and threading, with bad architectural consequences for
 * managing load-mores and truncation. The intention is that all of these
 * eventually route through CommentPool.
 */
const CommentPool = ({initialComments, initialExpansionState, topLevelCommentCount, totalCommentCount, loadMoreTopLevel, disableTopLevelLoadMore, treeOptions, startThreadTruncated=false, expandAllThreads=false, defaultNestingLevel=1, parentCommentId, parentAnswerId}: {
  /**
   * Initial set of comments to show. If this changes, will show at least the
   * union of every set of comments that has been passed as initialComments. May
   * be empty during loading states, but should not be empty when the dust has
   * settled unless representing a context in which there are no comments.
   */
  initialComments: CommentsList[],
  
  initialExpansionState?: Partial<Record<string,CommentExpansionState>>,
  
  /**
   * The number of top-level comments in the associated context, eg the number
   * of root comments on a post. This is used to determine whether there should
   * be a top-level Load More link. If not provided, there wont be one.
   */
  topLevelCommentCount?: number,
  
  /**
   * The total number of comments, used to determine what text to show in a
   * top-level
   * Load More link.
   */
  totalCommentCount?: number,
  
  /**
   * A function which takes a `limit`, does a query, and returns more comments.
   * If this and topLevelCommentCount are provided, this function will be called
   * when Load More is clicked, and the results it returns will be merged into
   * the loaded comment set. If not provided, there will be no top-level Load
   * More link.
   *
   * This function may return comments that are duplicates of ones that are
   * already loaded, may return comments that are replies to other comments it
   * returns, and may return comments that are disconnected replies. The only
   * real requirements are:
   *   (1) If `limit` is large enough, every top-level comment will be returned
   *   eventually; and
   *   (2) If a comment doesn't have a parentCommentId, it's a top-level
   *   comment that should be shown.
   */
  loadMoreTopLevel?: (limit: number)=>Promise<CommentsList[]>,

  /**
   * If set, a top-level load more will never be shown (even if loading comments
   * tells us that they're there). Used for shortform-container posts.
   */
  disableTopLevelLoadMore?: boolean

  treeOptions: CommentTreeOptions,
  startThreadTruncated?: boolean,
  expandAllThreads?: boolean,
  defaultNestingLevel?: number,
  parentCommentId?: string,
  parentAnswerId?: string,
  classes: ClassesType,
}) => {
  const client = useApolloClient();
  const [initialState] = useState(() => initialStateFromComments(initialComments, initialExpansionState));
  const forceRerender = useForceRerender();
  const stateRef = useRef<CommentPoolState>(initialState);
  const { CommentNodeOrPlaceholder, LoadMore } = Components;
  const [haveLoadedAll,setHaveLoadedAll] = useState(false);

  const loadAll = useCallback(async () => {
    if (!loadMoreTopLevel) return;

    // TODO: Replace this with narrower loaders?
    if (!haveLoadedAll) {
      const loadedComments = await loadMoreTopLevel(5000);
      setHaveLoadedAll(true);
      stateRef.current = addLoadedComments(stateRef.current, loadedComments);
    }
  }, [loadMoreTopLevel, haveLoadedAll]);

  const showMoreChildrenOf = useCallback(async (commentId: string) => {
    await loadAll();
    stateRef.current = revealChildren(stateRef.current, commentId, 10);
    forceRerender();
  }, [forceRerender, loadAll]);
  
  const showParentOf = useCallback(async (commentId: string) => {
    await loadAll();
    stateRef.current = revealParentOf(stateRef.current, commentId);
    forceRerender();
  }, [forceRerender, loadAll]);

  const showAncestorChain = useCallback(async (commentId: string) => {
    await loadAll();
    stateRef.current = revealAncestorChain(stateRef.current, commentId);
    forceRerender();
  }, [forceRerender, loadAll]);
  
  const setExpansion = useCallback(async (commentId: string, newExpansionState: CommentExpansionState) => {
    const oldExpansionState = stateRef.current.commentsById[commentId]?.expansion ?? "default";
    if (newExpansionState !== oldExpansionState) {
      await loadAll();
      stateRef.current = changeExpansionState(stateRef.current, commentId, oldExpansionState, newExpansionState),
      forceRerender();
    }
  }, [forceRerender, loadAll]);

  const invalidateComment = useCallback(async (commentId: string): Promise<void> => {
    const updatedComment = await loadSingle({
      documentId: commentId,
      collectionName: "Comments",
      fragmentName: "CommentsList",
      client,
    });
    if (updatedComment) {
      stateRef.current.commentsById[commentId].comment = updatedComment;
      forceRerender();
    }
  }, [client, forceRerender]);

  const addComment = useCallback(async (comment: CommentsList): Promise<void> => {
    stateRef.current.commentsById[comment._id] = {
      comment,
      visibility: "visible",
      expansion: "default",
      rerender: null,
      otherState: {},
    };
    stateRef.current.commentsSortOrder.push(comment._id);
    forceRerender();
  }, [forceRerender]);
  
  const getCommentState = useCallback((commentId: string): SingleCommentState => {
    return stateRef.current.commentsById[commentId];
  }, []);

  const context: CommentPoolContextType = useMemo(() => ({
    showMoreChildrenOf, showParentOf, showAncestorChain, setExpansion, invalidateComment, addComment, getCommentState
  }), [showMoreChildrenOf, showParentOf, showAncestorChain, setExpansion, invalidateComment, addComment, getCommentState]);
  
  const wrappedLoadMoreTopLevel = useCallback(async () => {
    await loadAll();
    stateRef.current = revealTopLevel(stateRef.current, 10);
    forceRerender();
  }, [forceRerender, loadAll]);
  
  const tree = getVisibleCommentsTree(stateRef.current);

  treeOptions = {
    ...treeOptions,
    singleLineCommentsShowDescendentCount: true,
    hiddenCommentIconColor: "dark",
  };

  const showTopLevelLoadMore = !disableTopLevelLoadMore && (
    (!haveLoadedAll && topLevelCommentCount && topLevelCommentCount > countVisibleTopLevelComments(stateRef.current))
    || hasHiddenTopLevelComments(stateRef.current)
  );
  
  const numHiddenByTopLevelLoadMore: number|null = (totalCommentCount !== undefined)
    ? totalCommentCount
        - sumBy(tree, topLevelComment=>(topLevelComment.item?.descendentCount??0)+1)
    : null;
  
  return <CommentPoolContext.Provider value={context}>
    {tree.map(comment =>
      <CommentNodeOrPlaceholder
        treeOptions={treeOptions}
        startThreadTruncated={startThreadTruncated}
        expandAllThreads={expandAllThreads}
        treeNode={comment}
        key={comment._id}
        parentCommentId={parentCommentId}
        parentAnswerId={parentAnswerId}
        shortform={(treeOptions.post as PostsBase)?.shortform}
        isChild={defaultNestingLevel > 1}
      />
    )}
    {showTopLevelLoadMore && <LoadMore
      loadMore={wrappedLoadMoreTopLevel}
      message={`Load More (${numHiddenByTopLevelLoadMore} comments)`}
    />}
  </CommentPoolContext.Provider>
}

export const DontInheritCommentPool = ({children}: {
  children: React.ReactNode
}) => {
  return <CommentPoolContext.Provider value={null}>
    {children}
  </CommentPoolContext.Provider>
}


/**
 * Get a tree of all visible comments, excluding unloaded comments and comments
 * hidden behind Load More links.
 */
function getVisibleCommentsTree(state: CommentPoolState): CommentTreeNode<CommentsList>[] {
  const loadedComments: SingleCommentState[] = state.commentsSortOrder.map(commentId => state.commentsById[commentId]);
  const visibleComments = filter(loadedComments, c=>c.visibility!=="hidden");
  return unflattenComments(visibleComments.map(c=>c.comment));
}

/**
 * Get a tree of all loaded comments, including comments hidden behind Load More
 * links.
 */
function getLoadedCommentsTree(state: CommentPoolState): CommentTreeNode<CommentsList>[] {
  const commentsIncludedInSortOrder: SingleCommentState[] = state.commentsSortOrder.map(commentId => state.commentsById[commentId]);
  const commentsSeen = new Set<string>();
  for (let node of commentsIncludedInSortOrder) {
    commentsSeen.add(node.comment._id);
  }

  const otherComments: SingleCommentState[] = Object.keys(state.commentsById).filter(id => !commentsSeen.has(id)).map(id => state.commentsById[id]);
  const otherCommentsSorted = orderBy(otherComments, c => -c.comment?.baseScore ?? 0);
  
  return unflattenComments([...commentsIncludedInSortOrder, ...otherCommentsSorted].map(c=>c.comment));
}

/**
 * Search a threaded comment-tree for a comment with the given ID. Returns the
 * comment's tree node, or null if it's not in the tree.
 */
function findCommentInTree(tree: CommentTreeNode<CommentsList>[], commentId: string): CommentTreeNode<CommentsList>|null {
  for (let node of tree) {
    if (node._id === commentId)
      return node;
    const nodeInSubtree = findCommentInTree(node.children, commentId);
    if (nodeInSubtree)
      return nodeInSubtree;
  }
  return null;
}


function initialStateFromComments(initialComments: CommentsList[], initialExpansionState: Partial<Record<string,CommentExpansionState>>|undefined): CommentPoolState {
  return {
    commentsSortOrder: initialComments.map(c=>c._id),
    commentsById: keyBy(
      initialComments.map(comment => ({
        comment,
        visibility: "visible",
        expansion: initialExpansionState?.[comment._id] ?? "default",
        rerender: null,
        otherState: {},
      })),
      c => c.comment._id
    ),
  };
}

function addLoadedComments(state: CommentPoolState, loadedComments: CommentsList[]): CommentPoolState {
  const newCommentStates = {...state.commentsById};
  const addedCommentIds: string[] = [];
  for (let comment of loadedComments) {
    if (!newCommentStates[comment._id]) {
      addedCommentIds.push(comment._id);
      newCommentStates[comment._id] = {
        comment,
        visibility: "hidden",
        expansion: "default",
        rerender: null,
        otherState: {},
      };
    }
  }
  return {
    ...state,
    commentsSortOrder: state.commentsSortOrder,
    commentsById: newCommentStates,
  };
}

function countVisibleTopLevelComments(state: CommentPoolState): number {
  return Object.values(state.commentsById)
    .filter(commentState => !commentState.comment.parentCommentId && commentState.visibility!=="hidden")
    .length
}

function hasHiddenTopLevelComments(state: CommentPoolState): boolean {
  return Object.values(state.commentsById)
    .some(commentState => !commentState.comment.parentCommentId && commentState.visibility==="hidden");
}


/**
 * Reveal up to n top-level comments. Called when clicking the Load More at the
 * bottom of a comment pool.
 */
function revealTopLevel(state: CommentPoolState, n: number): CommentPoolState {
  const tree = getLoadedCommentsTree(state);

  const hiddenTopLevelCommentIds: string[] = Object.keys(state.commentsById)
    .filter(commentId =>
      !state.commentsById[commentId].comment.parentCommentId
      && state.commentsById[commentId].visibility==="hidden"
    );
  const byDescendingKarma = orderBy(hiddenTopLevelCommentIds,
    commentId => -state.commentsById[commentId].comment.baseScore);

  const commentIdsToReveal = take(byDescendingKarma, n);
  
  // TODO: Make a decision about the truncation-state of these
  const initialTruncation: Partial<Record<string,CommentExpansionState>> = toDictionary(
    commentIdsToReveal, id=>id,
    id=>'truncated'
  );
  
  // If a revealed comment has children, reveal the first 2 children as single-line
  for (let commentId of [...commentIdsToReveal]) {
    const node = findCommentInTree(tree, commentId);
    if (node && node.children.length>0) {
      const childrenByDescedingKarma = orderBy(node.children,
        child => -state.commentsById[child._id].comment.baseScore
      );
      const topChildren = take(childrenByDescedingKarma, 2);
      for (let revealedChild of topChildren) {
        initialTruncation[revealedChild._id] = "singleLine";
        commentIdsToReveal.push(revealedChild._id);
      }
    }
  }

  return revealComments(state, commentIdsToReveal, initialTruncation);
}

/**
 * Reveal up to n children of the given comment. Called when clicking a
 * load-more within a comment that has hidden children.
 */
function revealChildren(state: CommentPoolState, parentCommentId: string, n: number): CommentPoolState {
  const hiddenChildComments = Object.keys(state.commentsById)
    .filter(commentId =>
      state.commentsById[commentId].comment.parentCommentId === parentCommentId
      && state.commentsById[commentId].visibility==="hidden"
    );
  const byDescendingKarma = orderBy(hiddenChildComments,
    commentId => -state.commentsById[commentId].comment.baseScore);

  const commentIdsToReveal = take(byDescendingKarma, n);
  // TODO: Make a decision about the truncation-state of these
  const initialStates: Partial<Record<string,CommentExpansionState>> = toDictionary(
    commentIdsToReveal,
    id=>id, id=>'singleLine'
  );
  return revealComments(state, commentIdsToReveal, initialStates);
}

function revealParentOf(state: CommentPoolState, commentId: string): CommentPoolState {
  const parentCommentId = state.commentsById[commentId]?.comment.parentCommentId;
  if (parentCommentId) {
    return revealComments(state, [parentCommentId], {[parentCommentId]: "truncated"});
  } else {
    return state;
  }
}

/**
 * Called when clicking the up-arrow icon in the top-left corner of a comment
 * which has its parent hidden. Reveals all comments along the ancestor-chain of
 * that comment, up to the root.
 *
 * If this is one comment, reveals it as truncated. If this is multiple
 * comments, reveals them as single-line.
 */
function revealAncestorChain(state: CommentPoolState, commentId: string): CommentPoolState {
  const commentIdsToReveal: string[] = [];

  // For loop that climbs the tree from commentId up to the root
  for(let pos=state.commentsById[commentId]?.comment.parentCommentId; pos; pos=state.commentsById[pos]?.comment.parentCommentId) {
    commentIdsToReveal.push(pos);
  }
  
  if (commentIdsToReveal.length === 1) {
    return revealComments(state, commentIdsToReveal, {
      [commentIdsToReveal[0]]: "truncated"
    });
  } else {
    return revealComments(state, commentIdsToReveal, toDictionary(commentIdsToReveal, id=>id, _=>"singleLine"));
  }
}

function changeExpansionState(state: CommentPoolState, commentId: string, oldExpansionState: CommentExpansionState, newExpansionState: CommentExpansionState) {
  // Update the expansion-state
  state = {
    ...state,
    commentsById: {
      ...state.commentsById,
      [commentId]: {
        ...state.commentsById[commentId],
        expansion: newExpansionState,
      },
    },
  };
  
  // If we're expanding a single-line comment, reveal up to 5 children as single-line
  if ((oldExpansionState === "singleLine" || oldExpansionState === "singleLineGroupable") && newExpansionState !== "singleLine") {
    const tree = getLoadedCommentsTree(state);
    const commentNode = findCommentInTree(tree, commentId);
    if (commentNode) {
      const childrenToReveal = take(orderBy(commentNode.children, c => -(c.item?.baseScore??0)), 5);
      state = revealComments(state,
        childrenToReveal.map(c=>c._id),
        toDictionary(childrenToReveal, c=>c._id, _=>"singleLine")
      );
    }
  }
  
  rerenderComments(state, [commentId]);
  return state;
}


/**
 * Reveal a list of comments that are currently loaded but hidden. If some of
 * the comments selected are in the tree in a place where they're siblings of
 * each other, such that they have a sort-order relative to each other, that
 * sort order is the order in which they appear in `ids`. If they're siblings
 * of any comments that are already loaded, they appear after those comments.
 * Comments which were already visible are unchanged.
 *
 * If provided, `states` specifies the initial expansion state of revealed
 * comments, ie whether they're truncated and whether they're single-line. If
 * `states` is not provided or a comment ID is not included, the expansion-state
 * is "default", which means it's inferred from rules inside CommentsNode in
 * the same way it would be if it was part of the initially loaded set and was
 * not in a CommentPool.
 */
function revealComments(state: CommentPoolState, ids: string[], states: Partial<Record<string,CommentExpansionState>>): CommentPoolState {
  if (!ids.length)
    return state;

  let revealedIds = ids.filter(id => state.commentsById[id].visibility!=="visible");

  const newSortOrder = [...state.commentsSortOrder];
  for (let revealedId of revealedIds) {
    // If we reveal an ancestor of a comment that's already visible, insert it
    // into the sort order at the same position as its descendent, rather than
    // at the end.
    const descendentIds: string[] = [];
    getCommentTreeIds(state, descendentIds, revealedId);

    let inserted = false;
    for (let descendentId of descendentIds) {
      if (state.commentsById[descendentId].visibility === 'visible') {
        const descendentIndex = newSortOrder.findIndex((el)=>el===descendentId);
        if (descendentIndex >= 0) {
          newSortOrder.splice(descendentIndex, 0, revealedId);
          inserted = true;
          break;
        }
      }
    }
    
    if (!inserted) {
      newSortOrder.push(revealedId);
    }
  }

  return {
    ...state,
    commentsSortOrder: newSortOrder,
    commentsById: mapValues(state.commentsById,
      (c: SingleCommentState): SingleCommentState => {
        if (revealedIds.includes(c.comment._id)) {
          return {
            ...c,
            visibility: "visible",
            expansion: states?.[c.comment._id] ?? "default",
          }
        } else {
          return c;
        }
      }
    )
  };
}

function rerenderComments(state: CommentPoolState, ids: string[]) {
  for (let id of ids) {
    const rerender = state.commentsById[id]?.rerender
    if (rerender) {
      // Defer rerender through a setTimeout because otherwise the render
      // function happens *immediately*, and will go looking for comment-expansion
      // state that we haven't saved yet.
      setTimeout(rerender, 0);
    }
  }
}

function getCommentTreeIds(state: CommentPoolState, outIds: string[], root: string) {
  outIds.push(root);
  for (let childId of Object.keys(state.commentsById)) {
    if (state.commentsById[childId].comment.parentCommentId === root) {
      getCommentTreeIds(state, outIds, childId);
    }
  }
}

const CommentPoolComponent = registerComponent('CommentPool', CommentPool);

declare global {
  interface ComponentTypes {
    CommentPool: typeof CommentPoolComponent
  }
}

