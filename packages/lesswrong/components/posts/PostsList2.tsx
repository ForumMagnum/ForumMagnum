import React, { ReactNode, useCallback, useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { decodeIntlError } from '../../lib/vulcan-lib/utils';
import classNames from 'classnames';
import { AnalyticsContext, useOnMountTracking } from "../../lib/analyticsEvents";
import FormattedMessage from '../../lib/vulcan-i18n/message';
import { defineStyles, useStyles } from '../hooks/useStyles';
import LoadMore from "../common/LoadMore";
import PostsNoResults from "./PostsNoResults";
import SectionFooter from "../common/SectionFooter";
import PostsItem from "./PostsItem";
import PostsLoading from "./PostsLoading";
import { SuspenseWrapper } from '../common/SuspenseWrapper';
import { HideIfRepeated } from './HideRepeatedPostsContext';
import { useCurrentUser } from "../common/withUser";
import sortBy from 'lodash/sortBy';
import uniqBy from 'lodash/uniqBy';
import { postGetLastCommentedAt } from "../../lib/collections/posts/helpers";
import type { Placement as PopperPlacementType } from "popper.js";
import { isFriendlyUI } from "../../themes/forumTheme";
import type { PostsItemConfig } from "./postsItemHelpers";
import { PostsListViewType, usePostsListView } from "../hooks/usePostsListView";
import { gql } from "@/lib/generated/gql-codegen";
import { useQueryWithLoadMore } from '../hooks/useQueryWithLoadMore';

const Error = ({error}: any) => <div>
  <FormattedMessage id={error.id} values={{value: error.value}}/>{error.message}
</div>;

type PostsListConfig = {
  children?: React.ReactNode,
  terms?: PostsViewTerms,
  dimWhenLoading?: boolean,
  topLoading?: boolean,
  showLoading?: boolean,
  showLoadMore?: boolean,
  alwaysShowLoadMore?: boolean,
  showNoResults?: boolean,
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
  boxShadow?: boolean,
  curatedIconLeft?: boolean,
  showFinalBottomBorder?: boolean,
  hideHiddenFrontPagePosts?: boolean,
  hideShortform?: boolean,
  loadMoreMessage?: string,
  viewType?: PostsListViewType | "fromContext",
  showPlacement?: boolean,
  order?: string[],
  header?: ReactNode,
  repeatedPostsPrecedence?: number,
};

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

const getDefaultTooltipPlacement = () => isFriendlyUI()
  ? "bottom-start"
  : "bottom-end";

const styles = defineStyles("PostsList2", (theme: ThemeType) => ({
  itemIsLoading: {
    opacity: .4,
  },
  postsBoxShadow: {
    boxShadow: theme.palette.boxShadow.default,
  },
  postsGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, min-content) minmax(10px, 1fr)',
    columnGap: '20px',
  },
  placement: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: '1px',
  },
}));

const PostsList2 = (props: PostsListConfig) => {
  return <SuspenseWrapper name="PostsList2" fallback={
    <PostsLoading
      placeholderCount={props.placeholderCount ?? props.terms?.limit ?? 1}
      showFinalBottomBorder={props.showFinalBottomBorder}
      viewType={"list"}
      loadMore={props.alwaysShowLoadMore}
    >
      {props.children}
    </PostsLoading>
  }>
    <PostsListLoaded {...props}/>
  </SuspenseWrapper>
}

/** A list of posts, defined by a query that returns them. */
const PostsListLoaded = ({...props}: PostsListConfig) => {
  const {
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
    tooltipPlacement = getDefaultTooltipPlacement(),
    boxShadow = true,
    curatedIconLeft = false,
    showFinalBottomBorder = false,
    hideHiddenFrontPagePosts = false,
    hideShortform = false,
    loadMoreMessage,
    viewType: configuredViewType = "list",
    showPlacement = false,
    order,
    header,
    repeatedPostsPrecedence,
  } = props;
  const [haveLoadedMore, setHaveLoadedMore] = useState(false);
  const currentUser = useCurrentUser();
  const classes = useStyles(styles);
  const { getView } = usePostsListView();
  const contextViewType = getView();
  const viewType: PostsListViewType = configuredViewType === "fromContext"
    ? contextViewType
    : configuredViewType;

  const tagVariables = tagId
    ? {
      extraVariables: {
        tagId: "String",
      },
      extraVariablesValues: { tagId },
    } as const
    : {};

  const query = tagId ? postsListTagWithVotesQuery : postsListWithVotesQuery;
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

  const hiddenPosts: Record<string, boolean> = {};
  if (results?.length) {
    if (hideLastUnread && !haveLoadedMore) {
      for (let i = results.length - 1; i >= 0; i--) {
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
      for (const metadata of currentUser.hiddenPostsMetadata || []) {
        hiddenPosts[metadata.postId] = true;
      }
    }
  }

  const maybeMorePosts = !!(results?.length && (results.length >= limit)) || alwaysShowLoadMore;
  const uniqueResults = results ? uniqBy(results, (post) => post._id) : results;
  let orderedResults = (order && uniqueResults)
    ? sortBy(uniqueResults, (post) => order.indexOf(post._id))
    : uniqueResults;

  if (defaultToShowUnreadComments && orderedResults) {
    orderedResults = sortBy(orderedResults, (post) => {
      const postLastCommentedAt = postGetLastCommentedAt(post);
      return !post.lastVisitedAt || !postLastCommentedAt || (new Date(post.lastVisitedAt) >= postLastCommentedAt);
    });
  }

  const postIds = (orderedResults || []).map((post) => post._id);
  const postIdsWithScores = (orderedResults || []).map((post) => ({
    postId: post._id,
    score: post.score,
    baseScore: post.baseScore,
  }));

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
    ({ _id }) => !(_id in hiddenPosts),
  ).map((post, index) => ({
    post,
    index,
    terms,
    showNominationCount,
    showReviewCount,
    showDraftTag,
    dense,
    showKarma,
    hideAuthor,
    hideTag,
    hideTrailingButtons,
    curatedIconLeft,
    tagRel: (tagId && !hideTagRelevance) ? (post as PostsListTag).tagRel : undefined,
    defaultToShowUnreadComments,
    showPostedAt,
    showBottomBorder: showFinalBottomBorder || (hasResults && index < (orderedResults.length - 1)),
    tooltipPlacement,
    viewType,
  }));

  const onLoadMore = useCallback(() => {
    void loadMore();
    setHaveLoadedMore(true);
  }, [loadMore]);

  if (!orderedResults && loading) {
    return (
      <PostsLoading
        placeholderCount={placeholderCount || limit}
        showFinalBottomBorder={showFinalBottomBorder}
        viewType={viewType}
        loadMore={showLoadMore}
      />
    );
  }

  if (!orderedResults?.length && !showNoResults) {
    return null
  }

  return (
    <>
      {header}
      <div className={classNames({[classes.itemIsLoading]: loading && dimWhenLoading})}>
        {error && <Error error={decodeIntlError(error)}/>}
        {loading && showLoading && (topLoading || dimWhenLoading) &&
          <PostsLoading
            placeholderCount={placeholderCount || limit}
            viewType={viewType}
            loadMore={showLoadMore}
          />
        }
        {orderedResults && !orderedResults.length && <PostsNoResults/>}

        <AnalyticsContext viewType={viewType}>
          <div className={classNames(
            boxShadow && classes.postsBoxShadow,
            showPlacement && classes.postsGrid,
          )}>
            {itemProps?.map((props) => <React.Fragment key={props.post._id}>
              <HideIfRepeated precedence={repeatedPostsPrecedence} postId={props.post._id}>
                {showPlacement && props.index !== undefined && <div className={classes.placement}>
                  #{props.index + 1}
                </div>}
                <PostsItem  {...props} />
              </HideIfRepeated>
            </React.Fragment>)}
          </div>
        </AnalyticsContext>

        {showLoadMore && <SectionFooter>
          <LoadMore
            {...loadMoreProps}
            loading={loading}
            loadMore={loadMore}
            hideLoading={dimWhenLoading || !showLoading}
            // It's important to use hidden here rather than not rendering the component,
            // because LoadMore has an "isFirstRender" check that prevents it from showing loading dots
            // on the first render. Not rendering resets this
            hidden={!maybeMorePosts && !loading}
            sectionFooterStyles
          />
          {children}
        </SectionFooter>}
      </div>
    </>
  )
}

export default registerComponent('PostsList2', PostsList2, {
  areEqual: {
    terms: "deep",
  },
});


