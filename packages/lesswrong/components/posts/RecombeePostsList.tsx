import React, { useState } from 'react';
import { NetworkStatus, gql, useQuery } from '@apollo/client';
import { HybridRecombeeConfiguration, RecombeeConfiguration } from '../../lib/collections/users/recommendationSettings';
import { useOnMountTracking } from '../../lib/analyticsEvents';
import uniq from 'lodash/uniq';
import { filterNonnull } from '../../lib/utils/typeGuardUtils';
import moment from 'moment';
import { useCurrentUser } from '../common/withUser';
import { aboutPostIdSetting } from '@/lib/instanceSettings';
import { IsRecommendationContext } from '../dropdowns/posts/PostActions';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { fragmentTextForQuery } from "../../lib/vulcan-lib/fragments";
import { LoadMore } from "../common/LoadMore";
import { PostsItem } from "./PostsItem";
import { SectionFooter } from "../common/SectionFooter";
import { PostsLoading } from "./PostsLoading";

// Would be nice not to duplicate in postResolvers.ts but unfortunately the post types are different
interface RecombeeRecommendedPost {
  post: PostsListWithVotes,
  scenario: string,
  recommId: string,
  generatedAt: Date,
  curated?: never,
  stickied?: never,
}

type RecommendedPost = RecombeeRecommendedPost | {
  post: PostsListWithVotes,
  scenario?: never,
  recommId?: never,
  generatedAt?: never,
  curated: boolean,
  stickied: boolean,
};

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

const styles = (theme: ThemeType) => ({
  root: {

  }
});

const DEFAULT_RESOLVER_NAME = 'RecombeeLatestPosts';
const HYBRID_RESOLVER_NAME = 'RecombeeHybridPosts';

type RecombeeResolver = typeof DEFAULT_RESOLVER_NAME | typeof HYBRID_RESOLVER_NAME;

const getRecombeePostsQuery = (resolverName: RecombeeResolver) => gql`
  query get${resolverName}($limit: Int, $settings: JSON) {
    ${resolverName}(limit: $limit, settings: $settings) {
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
  ${fragmentTextForQuery('PostsListWithVotes')}
`;

const isWithinLoadMoreWindow = (recGeneratedAt: Date) => {
  // Use 29 minutes instead of 30 as the cutoff for considering recommendations stale, just to have a bit of buffer.
  const loadMoreTtlMs = 1000 * 60 * 29;
  const cutoff = moment().subtract(loadMoreTtlMs, 'ms');

  return moment(recGeneratedAt).isAfter(cutoff);
};

const getLoadMoreSettings = (resolverName: RecombeeResolver, results: RecommendedPost[], loadMoreCount: number): LoadMoreSettings => {
  const staleRecommIds = filterNonnull(uniq(
    results
      .filter(({ generatedAt }) => generatedAt && !isWithinLoadMoreWindow(generatedAt))
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

export const stickiedPostTerms: PostsViewTerms = {
  view: 'stickied',
  limit: 4, // seriously, shouldn't have more than 4 stickied posts
  forum: true
};

export const RecombeePostsListInner = ({ algorithm, settings, limit = 15, classes }: {
  algorithm: string,
  settings: RecombeeConfiguration,
  limit?: number,
  classes: ClassesType<typeof styles>,
}) => {
  const [loadMoreCount, setLoadMoreCount] = useState(1);
  const currentUser = useCurrentUser();

  const recombeeSettings = { ...settings, scenario: algorithm };

  const resolverName = algorithm === 'recombee-hybrid'
    ? HYBRID_RESOLVER_NAME
    : DEFAULT_RESOLVER_NAME;

  const query = getRecombeePostsQuery(resolverName);
  const { data, loading, fetchMore, networkStatus } = useQuery(query, {
    notifyOnNetworkStatusChange: true,
    pollInterval: 0,
    variables: {
      limit,
      settings: recombeeSettings,
    },
  });

  const results: RecommendedPost[] | undefined = data?.[resolverName]?.results;

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
    <div className={classes.root}>
      {filteredResults.map(({ post, recommId, curated, stickied }) => <IsRecommendationContext.Provider key={post._id} value={!!recommId}>
        <PostsItem 
          post={post} 
          recombeeRecommId={recommId} 
          curatedIconLeft={curated} 
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

export const RecombeePostsList = registerComponent('RecombeePostsList', RecombeePostsListInner, {styles});

declare global {
  interface ComponentTypes {
    RecombeePostsList: typeof RecombeePostsList
  }
}
