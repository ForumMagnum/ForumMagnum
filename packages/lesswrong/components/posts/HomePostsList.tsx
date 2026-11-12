import { useForumType } from '@/components/hooks/useForumType';
import React, { useState } from 'react';
import { NetworkStatus } from '@apollo/client';
import { useQuery } from "@/lib/crud/useQuery"
import { HybridRecombeeConfiguration, RecombeeConfiguration } from '../../lib/collections/users/recommendationSettings';
import { AnalyticsContext, useOnMountTracking, useTracking } from '../../lib/analyticsEvents';
import uniq from 'lodash/uniq';
import { filterNonnull } from '../../lib/utils/typeGuardUtils';
import moment from 'moment';
import { useCurrentUser } from '../common/withUser';
import { aboutPostIdSetting } from '@/lib/instanceSettings';
import { IsRecommendationContext } from '../dropdowns/posts/PostActions';
import LoadMore, { LoadMorePlaceholder } from "../common/LoadMore";
import PostsItem from "./PostsItem";
import SectionFooter from "../common/SectionFooter";
import PostsLoading from "./PostsLoading";
import { gql } from '@/lib/generated/gql-codegen';
import { stickiedPostTerms } from '@/lib/collections/posts/constants';
import { SuspenseWrapper } from '../common/SuspenseWrapper';
import { registerComponent } from '@/lib/vulcan-lib/components';
import uniqBy from 'lodash/uniqBy';
import { useLoadMoreExpansion } from '../hooks/useLoadMoreExpansion';
import { useABTest } from '../hooks/useAbTests';
import { frontpagePostsPagingABTest } from '@/lib/abTests';
import { useListPages, type ListPage } from '../hooks/useListPages';
import SlidingPages from '../common/SlidingPages';
import PrevNextNavigation, { type PrevNextNavigationProps } from '../common/PrevNextNavigation';
import { useIsAboveBreakpoint } from '../hooks/useScreenWidth';
import { useTheme } from '../themes/useTheme';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { isClient } from '@/lib/executionEnvironment';
import LWPlaceholderPostsItem from './LWPlaceholderPostsItem';
import range from 'lodash/range';

type LoadMoreSettings = {
  loadMore: (RecombeeConfiguration | HybridRecombeeConfiguration)['loadMore'];
  excludedPostIds: string[];
} | {
  loadMore?: never;
  excludedPostIds: string[]
} | {
  loadMore: (RecombeeConfiguration | HybridRecombeeConfiguration)['loadMore'];
  excludedPostIds?: never
} | undefined;

const styles = defineStyles("HomePostsList", (theme: ThemeType) => ({
  hiddenOnPhones: {
    [theme.breakpoints.down('xs')]: {
      '&&': {
        display: "none",
      },
    },
  },
  phonesOnly: {
    [theme.breakpoints.up('sm')]: {
      '&&': {
        display: "none",
      },
    },
  },
}));

const PAGING_MIN_BREAKPOINT = 'sm';

const CLASSIC_ALGORITHM = 'forum-classic';
const HYBRID_ALGORITHM = 'recombee-hybrid';

const DEFAULT_RESOLVER_NAME = 'RecombeeLatestPosts';
const HYBRID_RESOLVER_NAME = 'RecombeeHybridPosts';
const CLASSIC_RESOLVER_NAME = 'ClassicFrontpagePosts';

type HomePostsResolver = typeof DEFAULT_RESOLVER_NAME | typeof HYBRID_RESOLVER_NAME | typeof CLASSIC_RESOLVER_NAME;

type HomePostsQueryResult = getRecombeeLatestPostsQuery | getRecombeeHybridPostsQuery | getClassicFrontpagePostsQuery;
type HomePostsResult = getRecombeeHybridPostsQuery_RecombeeHybridPosts_RecombeeHybridPostsResult_results_RecombeeRecommendedPost;

const RecombeeLatestPostsQuery = gql(`
  query getRecombeeLatestPosts($limit: Int, $settings: JSON) {
    RecombeeLatestPosts(limit: $limit, settings: $settings) {
      results {
        post {
          ...PostsListWithVotes
        }
        scenario
        recommId
        generatedAt
        curated
        stickied
      }
    }
  }
`);

const RecombeeHybridPostsQuery = gql(`
  query getRecombeeHybridPosts($limit: Int, $settings: JSON) {
    RecombeeHybridPosts(limit: $limit, settings: $settings) {
      results {
        post {
          ...PostsListWithVotes
        }
        scenario
        recommId
        generatedAt
        curated
        stickied
      }
    }
  }
`);

const ClassicFrontpagePostsQuery = gql(`
  query getClassicFrontpagePosts($limit: Int, $settings: JSON) {
    ClassicFrontpagePosts(limit: $limit, settings: $settings) {
      results {
        post {
          ...PostsListWithVotes
        }
        scenario
        recommId
        generatedAt
        curated
        stickied
      }
    }
  }
`);

const queriesByResolver = {
  [DEFAULT_RESOLVER_NAME]: RecombeeLatestPostsQuery,
  [HYBRID_RESOLVER_NAME]: RecombeeHybridPostsQuery,
  [CLASSIC_RESOLVER_NAME]: ClassicFrontpagePostsQuery,
};

const getResolverName = (algorithm: string): HomePostsResolver => {
  if (algorithm === CLASSIC_ALGORITHM) return CLASSIC_RESOLVER_NAME;
  if (algorithm === HYBRID_ALGORITHM) return HYBRID_RESOLVER_NAME;
  return DEFAULT_RESOLVER_NAME;
};

const getQueryResults = (data: HomePostsQueryResult | undefined): HomePostsResult[] | undefined => {
  if (!data) return undefined;
  if ('RecombeeLatestPosts' in data) return data.RecombeeLatestPosts?.results;
  if ('RecombeeHybridPosts' in data) return data.RecombeeHybridPosts?.results;
  return data.ClassicFrontpagePosts?.results;
};

const isWithinLoadMoreWindow = (recGeneratedAt: Date) => {
  // Use 29 minutes instead of 30 as the cutoff for considering recommendations stale, just to have a bit of buffer.
  const loadMoreTtlMs = 1000 * 60 * 29;
  const cutoff = moment().subtract(loadMoreTtlMs, 'ms');

  return moment(recGeneratedAt).isAfter(cutoff);
};

const getLoadMoreSettings = (resolverName: HomePostsResolver, results: HomePostsResult[], loadMoreCount: number): LoadMoreSettings => {
  if (resolverName === CLASSIC_RESOLVER_NAME) {
    return { excludedPostIds: results.map(({ post: { _id } }) => _id) };
  }

  const staleRecommIds = filterNonnull(uniq(
    results
      .filter(({ generatedAt }) => generatedAt && !isWithinLoadMoreWindow(new Date(generatedAt)))
      .map(({ recommId }) => recommId)
  ));

  const staleRecomms = results.filter(({ recommId }) => recommId && staleRecommIds.includes(recommId));
  const freshRecomms = results.filter(({ recommId }) => recommId && !staleRecommIds.includes(recommId));

  const excludedPostIds = staleRecomms.map(({ post: { _id } }) => _id);
  const [firstRecommId, secondRecommId] = filterNonnull(uniq(freshRecomms.map(({ recommId }) => recommId)));

  switch (resolverName) {
    case DEFAULT_RESOLVER_NAME: {
      if (staleRecomms.length && !freshRecomms.length) {
        return { excludedPostIds };
      } else if (!staleRecomms.length && freshRecomms.length) {
        return { loadMore: { prevRecommId: firstRecommId } };
      } else {
        return { excludedPostIds, loadMore: { prevRecommId: firstRecommId } };
      }
    }
    case HYBRID_RESOLVER_NAME: {
      if (staleRecomms.length && !freshRecomms.length) {
        return { excludedPostIds, loadMore: { prevRecommIds: [undefined, undefined], loadMoreCount } };
      } else if (!staleRecomms.length && freshRecomms.length) {
        return { loadMore: { prevRecommIds: [firstRecommId, secondRecommId], loadMoreCount } };
      } else {
        return { excludedPostIds, loadMore: { prevRecommIds: [firstRecommId, secondRecommId], loadMoreCount } };
      }
    }
  }
}

interface HomePostsListProps {
  algorithm: string,
  settings: RecombeeConfiguration,
  limit?: number,
  children?: React.ReactNode,
}

interface HomePostsPagesProps {
  results: HomePostsResult[],
  pageSize: number,
  loadMore: () => Promise<unknown>,
  loadingMore: boolean,
  emphasizeIfNew: boolean,
  paged: boolean,
  children?: React.ReactNode,
}

const HomePostsItem = ({ result, pageIndex, emphasizeIfNew }: {
  result: HomePostsResult,
  pageIndex: number,
  emphasizeIfNew: boolean,
}) => {
  const { post, recommId, curated, stickied } = result;
  return <AnalyticsContext postsFeedPageIndex={pageIndex}>
    <IsRecommendationContext.Provider value={!!recommId}>
      <PostsItem
        post={post}
        recombeeRecommId={recommId ?? undefined}
        curatedIconLeft={curated ?? undefined}
        emphasizeIfNew={emphasizeIfNew}
        terms={stickied ? stickiedPostTerms : undefined}
      />
    </IsRecommendationContext.Provider>
  </AnalyticsContext>;
};

const wholeListAsFirstPage = (pageIndex: number, itemCount: number): ListPage => ({
  start: pageIndex === 0 ? 0 : itemCount,
  end: itemCount,
  placeholderCount: 0,
});

// The paged list is what gets server-rendered for the paged group at every
// screen width, since the width isn't known until hydration. Until then, CSS
// shows phones the Load More that they're about to get instead.
const PagedListControls = (props: PrevNextNavigationProps) => {
  const classes = useStyles(styles);
  return <>
    <PrevNextNavigation {...props} className={classes.hiddenOnPhones} />
    <LoadMorePlaceholder sectionFooterStyles className={classes.phonesOnly} />
  </>;
};

const HomePostsPages = ({ results, pageSize, loadMore, loadingMore, emphasizeIfNew, paged, children }: HomePostsPagesProps) => {
  const { captureEvent } = useTracking();
  const { pageIndex, getPage, canGoToNextPage, goToNextPage, goToPreviousPage, setNextPageWanted } = useListPages({
    itemCount: results.length,
    pageSize,
    loadMore,
    loading: loadingMore,
  });
  const { listRef, prepareForLoadMore } = useLoadMoreExpansion({
    loading: loadingMore,
    itemCount: results.length,
    enabled: !paged,
  });

  // Whether paged or not, the posts are rendered through the same tree (the
  // unpaged list being a single page that holds everything), so that changing
  // between the two doesn't remount them. Phones do that on every hydration.
  const renderPage = (index: number) => {
    const { start, end, placeholderCount } = paged ? getPage(index) : wholeListAsFirstPage(index, results.length);
    return <>
      {results.slice(start, end).map((result, indexInPage) => <HomePostsItem
        key={result.post._id}
        result={result}
        pageIndex={paged ? index : Math.floor((start + indexInPage) / pageSize)}
        emphasizeIfNew={emphasizeIfNew}
      />)}
      {range(placeholderCount).map(placeholderIndex => <LWPlaceholderPostsItem key={placeholderIndex} showBottomBorder />)}
    </>;
  };

  return <div>
    <div ref={listRef}>
      <SlidingPages page={paged ? pageIndex : 0} renderPage={renderPage} />
    </div>
    <SectionFooter>
      {paged
        ? <PagedListControls
          onPrevious={() => {
            captureEvent("postsFeedPageChanged", { direction: "previous", fromPageIndex: pageIndex });
            goToPreviousPage();
          }}
          onNext={() => {
            captureEvent("postsFeedPageChanged", { direction: "next", fromPageIndex: pageIndex });
            goToNextPage();
          }}
          onNextHoverChange={setNextPageWanted}
          canGoPrevious={pageIndex > 0}
          canGoNext={canGoToNextPage}
        />
        : <LoadMore
          loading={loadingMore}
          loadMore={() => {
            prepareForLoadMore();
            void loadMore();
          }}
          sectionFooterStyles
        />
      }
      {children}
    </SectionFooter>
  </div>;
};

const HomePostsLoading = ({ limit, paged, children }: {
  limit: number,
  paged: boolean,
  children?: React.ReactNode,
}) => {
  return <PostsLoading placeholderCount={limit} loadMore={!paged}>
    {paged && <PagedListControls />}
    {children}
  </PostsLoading>;
};

const HomePostsListLoaded = ({ algorithm, settings, limit, paged, children }: HomePostsListProps & {
  limit: number,
  paged: boolean,
}) => {
  const { forumType } = useForumType();
  const [loadMoreCount, setLoadMoreCount] = useState(1);
  const currentUser = useCurrentUser();

  const querySettings = { ...settings, scenario: algorithm };
  const resolverName = getResolverName(algorithm);

  const { data, loading, fetchMore, networkStatus } = useQuery<HomePostsQueryResult>(queriesByResolver[resolverName], {
    variables: {
      limit,
      settings: querySettings,
    },
  });

  const results = getQueryResults(data);
  const uniqueResults = results ? uniqBy(results, p=>p.post._id) : results;

  const hiddenPostIds = currentUser?.hiddenPostsMetadata?.map(metadata => metadata.postId) ?? [];

  //exclude posts with hiddenPostIds
  const filteredResults = uniqueResults?.filter(({ post }) => !hiddenPostIds.includes(post._id));

  const postIds = filteredResults?.map(({post}) => post._id) ?? [];
  const postIdsWithScenario = filteredResults?.map(({ post, scenario, curated, stickied, generatedAt }, idx) => {
    let loggedScenario = scenario;
    if (!loggedScenario) {
      if (post._id === aboutPostIdSetting.get(forumType) && idx === 0) {
        loggedScenario = 'welcome-post';
      } else if (curated) {
        loggedScenario = 'curated';
      } else if (stickied) {
        loggedScenario = 'stickied';
      } else {
        loggedScenario = 'hacker-news';
      }
    }

    const data = { postId: post._id, scenario: loggedScenario };

    if (generatedAt) {
      return {...data, generatedAt: new Date(generatedAt).toISOString()};
    }

    return data;
  }) ?? [];

  useOnMountTracking({
    eventType: "postList",
    // TODO: Remove postIds which is redundant once analytics dashboard written to use postIdsWithScenario
    eventProps: { postIds, postIdsWithScenario, algorithm },
    captureOnMount: (eventProps) => eventProps.postIds.length > 0,
    skip: !postIds.length || loading,
  });

  if (loading && !filteredResults) {
    return <HomePostsLoading limit={limit} paged={paged}>{children}</HomePostsLoading>;
  }

  if (!filteredResults) {
    return null;
  }

  const loadMore = () => {
    const loadMoreSettings = getLoadMoreSettings(resolverName, filteredResults, loadMoreCount);
    return fetchMore({
      variables: {
        settings: { ...querySettings, ...loadMoreSettings },
      },
      // Update the apollo cache with the combined results of previous loads and the items returned by the current loadMore
      updateQuery: (prev: AnyBecauseHard, { fetchMoreResult }: AnyBecauseHard) => {
        setLoadMoreCount(loadMoreCount + 1);

        if (!fetchMoreResult) return prev;

        return {
          [resolverName]: {
            __typename: fetchMoreResult[resolverName].__typename,
            results: [...prev[resolverName].results, ...fetchMoreResult[resolverName].results]
          }
        };
      }
    });
  };

  return <HomePostsPages
    results={filteredResults}
    pageSize={limit}
    loadMore={loadMore}
    loadingMore={loading || networkStatus === NetworkStatus.fetchMore}
    emphasizeIfNew={algorithm !== CLASSIC_ALGORITHM}
    paged={paged}
  >
    {children}
  </HomePostsPages>;
}

const HomePostsListWrapper = ({ algorithm, settings, limit = 15, children }: HomePostsListProps) => {
  const theme = useTheme();
  const paginationGroup = useABTest(frontpagePostsPagingABTest);
  const wideEnoughForPaging = useIsAboveBreakpoint(PAGING_MIN_BREAKPOINT);
  const paged = paginationGroup === "paged" && wideEnoughForPaging;

  // Narrower screens aren't part of the test, whichever group they're in, so
  // their events carry no group. While hydrating, `wideEnoughForPaging` is
  // still the server's guess, which events fired on mount would be labelled
  // with, so this reads the width itself. It mustn't affect what's rendered.
  const inPagingTest = isClient
    ? window.innerWidth >= theme.breakpoints.values[PAGING_MIN_BREAKPOINT]
    : wideEnoughForPaging;

  return <AnalyticsContext postsFeedPagination={inPagingTest ? paginationGroup : undefined}>
    <SuspenseWrapper name="HomePostsList" fallback={
      <HomePostsLoading limit={limit} paged={paged}>{children}</HomePostsLoading>
    }>
      <HomePostsListLoaded
        // A different feed is a different list, which starts over from its first page
        key={JSON.stringify([algorithm, settings])}
        algorithm={algorithm}
        settings={settings}
        limit={limit}
        paged={paged}
      >
        {children}
      </HomePostsListLoaded>
    </SuspenseWrapper>
  </AnalyticsContext>;
}

export const HomePostsList = registerComponent("HomePostsList", HomePostsListWrapper, {
  areEqual: {
    settings: "deep",
  },
});
