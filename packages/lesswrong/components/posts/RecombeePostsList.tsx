import React, { useState } from 'react';
import { NetworkStatus } from '@apollo/client';
import { useQuery } from "@/lib/crud/useQuery"
import { HybridRecombeeConfiguration, RecombeeConfiguration } from '../../lib/collections/users/recommendationSettings';
import { useOnMountTracking } from '../../lib/analyticsEvents';
import uniq from 'lodash/uniq';
import { filterNonnull } from '../../lib/utils/typeGuardUtils';
import moment from 'moment';
import { useCurrentUser } from '../common/withUser';
import { aboutPostIdSetting } from '@/lib/instanceSettings';
import { IsRecommendationContext } from '../dropdowns/posts/PostActions';
import LoadMore from "../common/LoadMore";
import PostsItem from "./PostsItem";
import SectionFooter from "../common/SectionFooter";
import PostsLoading from "./PostsLoading";
import { gql } from '@/lib/generated/gql-codegen';
import { useStyles } from '../hooks/useStyles';
import { SuspenseWrapper } from '../common/SuspenseWrapper';
import { registerComponent } from '@/lib/vulcan-lib/components';

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

const DEFAULT_RESOLVER_NAME = 'RecombeeLatestPosts';
const HYBRID_RESOLVER_NAME = 'RecombeeHybridPosts';

type RecombeeResolver = typeof DEFAULT_RESOLVER_NAME | typeof HYBRID_RESOLVER_NAME;

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

const isWithinLoadMoreWindow = (recGeneratedAt: Date) => {
  // Use 29 minutes instead of 30 as the cutoff for considering recommendations stale, just to have a bit of buffer.
  const loadMoreTtlMs = 1000 * 60 * 29;
  const cutoff = moment().subtract(loadMoreTtlMs, 'ms');

  return moment(recGeneratedAt).isAfter(cutoff);
};

const getLoadMoreSettings = (resolverName: RecombeeResolver, results: getRecombeeHybridPostsQuery_RecombeeHybridPosts_RecombeeHybridPostsResult_results_RecombeeRecommendedPost[], loadMoreCount: number): LoadMoreSettings => {
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

export const stickiedPostTerms = {
  view: 'stickied',
  limit: 4, // seriously, shouldn't have more than 4 stickied posts
  forum: true
} satisfies PostsViewTerms;

const RecombeePostsListInner = ({ algorithm, settings, limit = 15 }: {
  algorithm: string,
  settings: RecombeeConfiguration,
  limit?: number,
}) => {
  const [loadMoreCount, setLoadMoreCount] = useState(1);
  const currentUser = useCurrentUser();

  const recombeeSettings = { ...settings, scenario: algorithm };

  const resolverName = algorithm === 'recombee-hybrid'
    ? HYBRID_RESOLVER_NAME
    : DEFAULT_RESOLVER_NAME;

  const query = algorithm === 'recombee-hybrid'
    ? RecombeeHybridPostsQuery
    : RecombeeLatestPostsQuery;

  const { data, loading, fetchMore, networkStatus } = useQuery<getRecombeeLatestPostsQuery | getRecombeeHybridPostsQuery>(query, {
    variables: {
      limit,
      settings: recombeeSettings,
    },
  });

  const results = data
    ? 'RecombeeLatestPosts' in data
      ? data.RecombeeLatestPosts?.results
      : data.RecombeeHybridPosts?.results
    : undefined;

  const hiddenPostIds = currentUser?.hiddenPostsMetadata?.map(metadata => metadata.postId) ?? [];
  
  //exclude posts with hiddenPostIds
  const filteredResults = results?.filter(({ post }) => !hiddenPostIds.includes(post._id));

  const postIds = filteredResults?.map(({post}) => post._id) ?? [];
  const postIdsWithScenario = filteredResults?.map(({ post, scenario, curated, stickied, generatedAt }, idx) => {
    let loggedScenario = scenario;
    if (!loggedScenario) {
      if (post._id === aboutPostIdSetting.get() && idx === 0) {
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
    return <PostsLoading placeholderCount={limit} />;
  }

  if (!filteredResults) {
    return null;
  }

  return <div>
    <div>
      {filteredResults.map(({ post, recommId, curated, stickied }) => <IsRecommendationContext.Provider key={post._id} value={!!recommId}>
        <PostsItem 
          post={post} 
          recombeeRecommId={recommId ?? undefined} 
          curatedIconLeft={curated ?? undefined} 
          emphasizeIfNew={true}
          terms={stickied ? stickiedPostTerms : undefined}
        />
      </IsRecommendationContext.Provider>)}
    </div>
    <SectionFooter>
      <LoadMore
        loading={loading || networkStatus === NetworkStatus.fetchMore}
        loadMore={() => {
          const loadMoreSettings = getLoadMoreSettings(resolverName, filteredResults, loadMoreCount);
          void fetchMore({
            variables: {
              settings: { ...recombeeSettings, ...loadMoreSettings },
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
        }}
        sectionFooterStyles
      />
    </SectionFooter>
  </div>;
}

const RecombeePostsListWrapper = ({ algorithm, settings, limit = 15 }: {
  algorithm: string,
  settings: RecombeeConfiguration,
  limit?: number,
}) => {
  return <SuspenseWrapper name="RecombeePostsList" fallback={<PostsLoading placeholderCount={limit}/>}>
    <RecombeePostsListInner
      algorithm={algorithm}
      settings={settings}
      limit={limit}
    />
  </SuspenseWrapper>
}

export const RecombeePostsList = registerComponent("RecombeePostsList", RecombeePostsListWrapper, {
  areEqual: {
    settings: "deep",
  },
});

