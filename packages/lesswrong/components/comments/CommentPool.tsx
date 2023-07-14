import React, { createContext, useRef, useState, useCallback, useMemo } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { unflattenComments } from '../../lib/utils/unflatten';
import { loadSingle } from '../../lib/crud/withSingle';
import type { CommentTreeOptions } from './commentTree';
import { useForceRerender } from '../hooks/useForceRerender';
import keyBy from 'lodash/keyBy';
import filter from 'lodash/filter';
import orderBy from 'lodash/orderBy';
import take from 'lodash/take';
import mapValues from 'lodash/mapValues';
import includes from 'lodash/includes';
import { useApolloClient } from '@apollo/client/react/hooks';

export interface CommentPoolContextType {
  showMoreChildrenOf: (commentId: string)=>Promise<void>
  showParentOf: (commentId: string)=>Promise<void>
  invalidateComment: (commentId: string)=>Promise<void>
  addComment: (comment: CommentsList)=>Promise<void>
}
export const CommentPoolContext = createContext<CommentPoolContextType|null>(null);

interface SingleCommentState {
  comment: CommentsList
  visibility: "hidden"|"visible"
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
const CommentPool = ({initialComments, topLevelCommentCount, loadMoreTopLevel, treeOptions, startThreadTruncated=false, expandAllThreads=false, defaultNestingLevel=1, parentCommentId, parentAnswerId}: {
  /**
   * Initial set of comments to show. If this changes, will show at least the
   * union of every set of comments that has been passed as initialComments. May
   * be empty during loading states, but should not be empty when the dust has
   * settled unless representing a context in which there are no comments.
   */
  initialComments: CommentsList[],
  
  /**
   * The number of top-level comments in the associated context, eg the number
   * of root comments on a post. This is used to determine whether there should
   * be a top-level Load More link. If not provided, there wont be one.
   */
  topLevelCommentCount?: number,
  
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

  treeOptions: CommentTreeOptions,
  startThreadTruncated?: boolean,
  expandAllThreads?: boolean,
  defaultNestingLevel?: number,
  parentCommentId?: string,
  parentAnswerId?: string,
  classes: ClassesType,
}) => {
  const client = useApolloClient();
  const [initialState] = useState(() => initialStateFromComments(initialComments));
  const forceRerender = useForceRerender();
  const stateRef = useRef<CommentPoolState>(initialState);
  const { CommentsNode, LoadMore } = Components;
  const [haveLoadedAll,setHaveLoadedAll] = useState(false);

  const loadAll = useCallback(async () => {
    if (!loadMoreTopLevel) return;

    // TODO: Replace this with narrower loaders
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
    stateRef.current = revealParent(stateRef.current, commentId);
    forceRerender();
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
    };
    forceRerender();
  }, [forceRerender]);

  const context: CommentPoolContextType = useMemo(() => ({
    showMoreChildrenOf, showParentOf, invalidateComment, addComment
  }), [showMoreChildrenOf, showParentOf, invalidateComment, addComment]);
  
  const wrappedLoadMoreTopLevel = useCallback(async () => {
    await loadAll();
    stateRef.current = revealTopLevel(stateRef.current, 10);
    forceRerender();
  }, [forceRerender, loadAll]);
  
  const loadedComments: SingleCommentState[] = stateRef.current.commentsSortOrder.map(commentId => stateRef.current.commentsById[commentId]);
  const visibleComments = filter(loadedComments, c=>c.visibility!=="hidden");
  const tree = unflattenComments(visibleComments.map(c=>c.comment));

  treeOptions = {
    ...treeOptions,
    singleLineCommentsShowDescendentCount: true,
  };

  return <CommentPoolContext.Provider value={context}>
    {tree.map(comment =>
      <CommentsNode
        treeOptions={treeOptions}
        startThreadTruncated={startThreadTruncated}
        expandAllThreads={expandAllThreads}
        comment={comment.item}
        childComments={comment.children}
        key={comment.item._id}
        parentCommentId={parentCommentId}
        parentAnswerId={parentAnswerId}
        shortform={(treeOptions.post as PostsBase)?.shortform}
        isChild={defaultNestingLevel > 1}
      />)
    }
    {/*topLevelCommentCount && loadMoreTopLevel && topLevelCommentCount>tree.length*/
      (
        (!haveLoadedAll && topLevelCommentCount && topLevelCommentCount > countVisibleTopLevelComments(stateRef.current))
          || hasHiddenTopLevelComments(stateRef.current)
      ) && <LoadMore
        loadMore={wrappedLoadMoreTopLevel}
        count={tree.length}
        totalCount={topLevelCommentCount}
      />
    }
  </CommentPoolContext.Provider>
}

function initialStateFromComments(initialComments: CommentsList[]): CommentPoolState {
  return {
    commentsSortOrder: initialComments.map(c=>c._id),
    commentsById: keyBy(
      initialComments.map(comment => ({comment, visibility: "visible"})),
      c => c.comment._id
    )
  };
}

function addLoadedComments(state: CommentPoolState, loadedComments: CommentsList[]): CommentPoolState {
  const newCommentStates = {...state.commentsById};
  const addedCommentIds: string[] = [];
  for (let comment of loadedComments) {
    if (!newCommentStates[comment._id]) {
      addedCommentIds.push(comment._id);
      newCommentStates[comment._id] = {
        comment, visibility: "hidden"
      };
    }
  }
  return {
    ...state,
    commentsSortOrder: [...state.commentsSortOrder, ...addedCommentIds],
    commentsById: newCommentStates,
  };
}

function countVisibleTopLevelComments(state: CommentPoolState): number {
  let count = 0
  for (let commentState of Object.values(state.commentsById)) {
    if (!commentState.comment.parentCommentId && commentState.visibility!=="hidden") {
      count++
    }
  }
  return count
}

function hasHiddenTopLevelComments(state: CommentPoolState): boolean {
  for (let commentState of Object.values(state.commentsById)) {
    if (!commentState.comment.parentCommentId && commentState.visibility==="hidden") {
      return true;
    }
  }
  return false;
}

function revealTopLevel(state: CommentPoolState, n: number): CommentPoolState {
  const hiddenTopLevelCommentIds: string[] = filter(
    Object.keys(state.commentsById),
    commentId => !state.commentsById[commentId].comment.parentCommentId
      && state.commentsById[commentId].visibility==="hidden"
  );
  const byDescendingKarma = orderBy(hiddenTopLevelCommentIds,
    commentId => -state.commentsById[commentId].comment.baseScore);

  const commentIdsToReveal = take(byDescendingKarma, n);
  return revealCommentIds(state, commentIdsToReveal);
}

function revealChildren(state: CommentPoolState, parentCommentId: string, n: number): CommentPoolState {
  const hiddenChildComments = filter(
    Object.keys(state.commentsById),
    commentId => state.commentsById[commentId].comment.parentCommentId === parentCommentId
      && state.commentsById[commentId].visibility==="hidden"
  );
  const byDescendingKarma = orderBy(hiddenChildComments,
    commentId => -state.commentsById[commentId].comment.baseScore);

  const commentIdsToReveal = take(byDescendingKarma, n);
  return revealCommentIds(state, commentIdsToReveal);
}

function revealParent(state: CommentPoolState, commentId: string): CommentPoolState {
  const parentCommentId = state.commentsById[commentId]?.comment.parentCommentId;
  if (!parentCommentId) return state;
  return revealCommentIds(state, [parentCommentId]);
}

function revealCommentIds(state: CommentPoolState, ids: string[]): CommentPoolState {
  if (!ids.length)
    return state;

  return {
    ...state,
    commentsById: mapValues(state.commentsById,
      (c: SingleCommentState): SingleCommentState => {
        if (includes(ids, c.comment._id))
          return {...c, visibility: "visible"}
        else
          return c;
      }
    )
  };
}

const CommentPoolComponent = registerComponent('CommentPool', CommentPool);

declare global {
  interface ComponentTypes {
    CommentPool: typeof CommentPoolComponent
  }
}

