import {useState, useCallback, ReactNode} from 'react'
import { useCurrentUser } from "../common/withUser";
import sortBy from 'lodash/sortBy';
import { postGetLastCommentedAt } from "../../lib/collections/posts/helpers";
import { useOnMountTracking } from "../../lib/analyticsEvents";
import type { Placement as PopperPlacementType } from "popper.js"
import { isFriendlyUI } from "../../themes/forumTheme";
import { PostsItemConfig } from "./usePostsItem";
import { PostsListViewType, usePostsListView } from "../hooks/usePostsListView";
import { gql } from "@/lib/generated/gql-codegen";
import { useQueryWithLoadMore } from '../hooks/useQueryWithLoadMore';

const postsListWithVotesQuery = gql(`
  query postsListWithVotes($selector: PostSelector, $limit: Int, $enableTotal: Boolean) {
    posts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...PostsListWithVotes
      }
      totalCount
    }
  }
`);

const postsListTagWithVotesQuery = gql(`
  query postsListTagWithVotes($selector: PostSelector, $limit: Int, $enableTotal: Boolean, $tagId: String) {
    posts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...PostsListTagWithVotes
      }
      totalCount
    }
  }
`);

export type PostsListConfig = {
  /** Child elements will be put in a footer section */
  children?: React.ReactNode,
  /** The search terms used to select the posts that will be shown. */
  terms?: PostsViewTerms,
  /**
   * Apply a style that grays out the list while it's in a loading state
   * (default false)
   */
  dimWhenLoading?: boolean,
  /** Show the loading state at the top of the list in addition to the bottom */
  topLoading?: boolean,
  /** Display a loading spinner while loading (default true) */
  showLoading?: boolean,
  /**
   * Show a Load More link in the footer if there are potentially more posts
   * (default true)
   */
  showLoadMore?: boolean,
  alwaysShowLoadMore?: boolean,
  /**
   * Show a placeholder if there are no results (otherwise render only whiteness)
   * (default true)
   */
  showNoResults?: boolean,
  /**
   * If the list ends with N sequential read posts, hide them, except for the
   * first post in the list
   */
  hideLastUnread?: boolean,
  showPostedAt?: boolean,
  enableTotal?: boolean,
  showNominationCount?: boolean,
  showReviewCount?: boolean,
  showDraftTag?: boolean,
  tagId?: string,
  dense?: boolean,
  defaultToShowUnreadComments?: boolean,
  itemsPerPage?: number,
  placeholderCount?: number,
  showKarma?: boolean,
  hideAuthor?: boolean,
  hideTag?: boolean,
  hideTrailingButtons?: boolean,
  hideTagRelevance?: boolean,
  tooltipPlacement?: PopperPlacementType,
  boxShadow?: boolean
  curatedIconLeft?: boolean,
  showFinalBottomBorder?: boolean,
  hideHiddenFrontPagePosts?: boolean
  hideShortform?: boolean,
  loadMoreMessage?: string,
  /**
   * The view to use for the items - if set to `fromContext` it will use the
   * value from the nearest `PostsListViewProvider` (which default to "list"
   * if there is no provider).
   */
  viewType?: PostsListViewType | "fromContext",
  /**
   * If true, then display the number corresponding to the post
   * item's placement in the list (i.e. index + 1) to the left of the row.
   */
  showPlacement?: boolean,
  /**
   * An array of postIds. If provided, we reorder the results to match this order.
   */
  order?: string[],
  header?: ReactNode,
  repeatedPostsPrecedence?: number
}

const defaultTooltipPlacement = isFriendlyUI
  ? "bottom-start"
  : "bottom-end";

export const usePostsList = <TagId extends string | undefined = undefined>({
  children,
  terms,
  dimWhenLoading = false,
  topLoading = false,
  showLoading = true,
  showLoadMore = true,
  alwaysShowLoadMore = false,
  showNoResults = true,
  hideLastUnread = false,
  showPostedAt = true,
  enableTotal = false,
  showNominationCount,
  showReviewCount,
  showDraftTag = true,
  tagId,
  dense,
  defaultToShowUnreadComments,
  itemsPerPage = 25,
  placeholderCount,
  showKarma = true,
  hideAuthor = false,
  hideTag = false,
  hideTrailingButtons = false,
  hideTagRelevance = false,
  tooltipPlacement=defaultTooltipPlacement,
  boxShadow = true,
  curatedIconLeft = false,
  showFinalBottomBorder = false,
  hideHiddenFrontPagePosts = false,
  hideShortform = false,
  loadMoreMessage,
  viewType: configuredViewType = "list",
  showPlacement = false,
  order,
  ...restProps
}: PostsListConfig) => {
  const [haveLoadedMore, setHaveLoadedMore] = useState(false);

  const tagVariables = tagId
    ? {
      extraVariables: {
        tagId: "String"
      },
      extraVariablesValues: { tagId }
    } as const
    : {};

  const query = !!tagId ? postsListWithVotesQuery : postsListTagWithVotesQuery;
  const { view = 'default', limit = 10, ...selectorTerms } = terms ?? {};

  const { data, error, loading, loadMoreProps } = useQueryWithLoadMore(query, {
    variables: {
      selector: { [view]: selectorTerms },
      limit,
      enableTotal,
      ...tagVariables.extraVariablesValues,
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: "cache-first",
    itemsPerPage,
    alwaysShowLoadMore,
  });

  const results: (PostsListTagWithVotes | PostsListWithVotes)[] | undefined = data?.posts?.results;

  const { loadMore } = loadMoreProps;

  // Map from post._id to whether to hide it. Used for client side post filtering
  // like e.g. hiding read posts
  const hiddenPosts: Record<string, boolean> = {};

  const currentUser = useCurrentUser();
  if (results?.length) {
    if (hideLastUnread && !haveLoadedMore) {
      // If the list ends with N sequential read posts, hide them, except for the first post in the list
      for (let i = results.length - 1; i >= 0; i--) {
        // FIXME: This uses the initial-load version of the read-status, and won't
        // update based on the client-side read status cache.
        if (results[i].isRead && i > 0) {
          hiddenPosts[results[i]._id] = true;
        } else {
          break;
        }
      }
    }

    if (hideShortform) {
      for (const result of results) {
        if (result.shortform) {
          hiddenPosts[result._id] = true;
        }
      }
    }

    if (currentUser && hideHiddenFrontPagePosts) {
      // Hide any posts that a user has explicitly hidden
      //
      // FIXME: this has an unfortunate edge case, where if a user hides enough
      // posts they'll end up with no frontpage! We're assuming this is very
      // unlikely, but consider moving this to server side
      for (const metadata of currentUser.hiddenPostsMetadata || []) {
        hiddenPosts[metadata.postId] = true;
      }
    }
  }

  // TODO-Q: Is there a composable way to check whether this is the second
  //         time that networkStatus === 1, in order to prevent the loading
  //         indicator showing up on initial pageload?
  //
  //         Alternatively, is there a better way of checking that this is
  //         in fact the best way of checking loading status?

  // TODO-A (2019-2-20): For now, solving this with a flag that determines whether
  //                     to dim the list during loading, so that the pages where that
  //                     behavior was more important can work fine. Will probably
  //                     fix this for real when Apollo 2 comes out

  // We don't actually know if there are more posts here, but if this condition fails
  // to meet we know that there definitely are no more posts
  const maybeMorePosts = !!(results?.length && (results.length >= limit)) ||
    alwaysShowLoadMore;

  let orderedResults = (order && results) ? sortBy(results, post => order.indexOf(post._id)) : results;
  if (defaultToShowUnreadComments && results) {
    orderedResults = sortBy(results, (post) => {
      const postLastCommentedAt = postGetLastCommentedAt(post)
      return !post.lastVisitedAt || !postLastCommentedAt || (new Date(post.lastVisitedAt) >= postLastCommentedAt);
    })
  }

  const postIds = (orderedResults || []).map((post) => post._id);

  const postIdsWithScores = (orderedResults || []).map((post) => {
      return {postId: post._id, score: post.score, baseScore: post.baseScore}
    });

  const {view: contextViewType} = usePostsListView();
  const viewType: PostsListViewType = configuredViewType === "fromContext"
    ? contextViewType
    : configuredViewType;

  // Analytics Tracking
  useOnMountTracking({
    eventType: "postList",
    eventProps: {
      postIds,
      postVisibility: hiddenPosts,
      postMountData: postIdsWithScores,
      viewType,
    },
    captureOnMount: (eventProps) => eventProps.postIds.length > 0,
    skip: !postIds.length || loading,
  });

  const hasResults = orderedResults && orderedResults.length > 1;

  const itemProps: PostsItemConfig[] | undefined = orderedResults?.filter(
    ({_id}) => !(_id in hiddenPosts),
  ).map((post, i) => ({
    post,
    index: i,
    terms,
    showNominationCount,
    showReviewCount,
    showDraftTag,
    dense,
    showKarma,
    hideAuthor,
    hideTag,
    hideTrailingButtons,
    curatedIconLeft: curatedIconLeft,
    tagRel: (tagId && !hideTagRelevance) ? (post as PostsListTag).tagRel : undefined,
    defaultToShowUnreadComments,
    showPostedAt,
    showBottomBorder: showFinalBottomBorder ||
      (hasResults && i < (orderedResults!.length - 1)),
    tooltipPlacement,
    viewType,
  }));

  const onLoadMore = useCallback(() => {
    void loadMore();
    setHaveLoadedMore(true);
  }, [loadMore]);

  return {
    children,
    showNoResults,
    hideLastUnread,
    showLoadMore,
    showLoading,
    dimWhenLoading,
    topLoading,
    boxShadow,
    loading,
    error,
    loadMore: onLoadMore,
    loadMoreProps: {
      ...loadMoreProps,
      message: loadMoreMessage,
    },
    maybeMorePosts,
    orderedResults,
    itemProps,
    limit,
    showFinalBottomBorder,
    placeholderCount,
    viewType,
    showPlacement,
    ...restProps,
  };
}
