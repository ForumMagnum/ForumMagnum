import React from 'react';
import { Components, fragmentTextForQuery, registerComponent } from '../../lib/vulcan-lib';
import { NetworkStatus, gql, useQuery } from '@apollo/client';
import { HybridRecombeeConfiguration, RecombeeConfiguration } from '../../lib/collections/users/recommendationSettings';
import { useMulti } from '../../lib/crud/withMulti';
import { useOnMountTracking } from '../../lib/analyticsEvents';
import uniq from 'lodash/uniq';

// Would be nice not to duplicate in postResolvers.ts but unfortunately the post types are different
interface RecombeeRecommendedPost {
  post: PostsListWithVotes,
  recommId?: string,
  curated?: boolean,
  stickied?: boolean,
}

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
        recommId
        curated
        stickied
      }
    }
  }
  ${fragmentTextForQuery('PostsListWithVotes')}
`;

type SingleOrHybridLoadMore<T extends RecombeeResolver> = 
  T extends typeof DEFAULT_RESOLVER_NAME
    ? RecombeeConfiguration['loadMore']
    : HybridRecombeeConfiguration['loadMore'];

const getLoadMoreSettings = (resolverName: RecombeeResolver, results: RecombeeRecommendedPost[]): (RecombeeConfiguration | HybridRecombeeConfiguration)['loadMore'] => {
  switch (resolverName) {
    case DEFAULT_RESOLVER_NAME:
      return { prevRecommId: results.slice(-1)[0]?.recommId };
    case HYBRID_RESOLVER_NAME:
      const [firstRecommId, secondRecommId] = uniq(results.map(({ recommId }) => recommId));
      return { prevRecommIds: [firstRecommId, secondRecommId] };
  }
}

export const stickiedPostTerms: PostsViewTerms = {
  view: 'stickied',
  limit: 4, // seriously, shouldn't have more than 4 stickied posts
  forum: true
};

export const RecombeePostsList = ({ algorithm, settings, showSticky = false, limit = 10, classes }: {
  algorithm: string,
  settings: RecombeeConfiguration,
  showSticky?: boolean,
  limit?: number,
  classes: ClassesType<typeof styles>,
}) => {
  const { Loading, LoadMore, PostsItem, SectionFooter, CuratedPostsList } = Components;

  // const { results: stickiedPosts } = useMulti({
  //   collectionName: "Posts",
  //   fragmentName: 'PostsListWithVotes',
  //   terms: stickiedPostTerms,
  //   skip: !showSticky,
  // });

  const recombeeSettings = { ...settings, scenario: algorithm };

  const resolverName = algorithm === 'recombee-hybrid'
    ? HYBRID_RESOLVER_NAME
    : DEFAULT_RESOLVER_NAME;

  const query = getRecombeePostsQuery(resolverName);
  const { data, loading, fetchMore, networkStatus } = useQuery(query, {
    ssr: true,
    notifyOnNetworkStatusChange: true,
    pollInterval: 0,
    variables: {
      limit,
      settings: recombeeSettings,
    },
  });

  const results: RecombeeRecommendedPost[] | undefined = data?.[resolverName]?.results;
  // const stickiedPostIds = stickiedPosts?.map(post => post._id) ?? [];
  const postIds = results?.map(({post}) => post._id) ?? [];
  // const postIds = [...stickiedPostIds, ...recombeePostIds];

  useOnMountTracking({
    eventType: "postList",
    eventProps: { postIds },
    captureOnMount: (eventProps) => eventProps.postIds.length > 0,
    skip: !postIds.length || loading,
  });

  if (loading && !results) {
    return <Loading />;
  }

  if (!results) {
    return null;
  }

  console.log({postResults: results.map(result => {result.post._id, result.post.title, result.recommId, result.curated, result.stickied})})

  return <div>
    <div className={classes.root}>
      {/* <CuratedPostsList />
      {stickiedPosts?.map(post => <PostsItem key={post._id} post={post} terms={stickiedPostTerms}/>)} */}
      {results.map(({post, recommId, curated, stickied }) => <PostsItem 
        key={post._id} 
        post={post} 
        recombeeRecommId={recommId} 
        curatedIconLeft={curated} 
        terms={stickied ? stickiedPostTerms : undefined}
      />)}
    </div>
    <SectionFooter>
      <LoadMore
        loading={loading || networkStatus === NetworkStatus.fetchMore}
        loadMore={() => {
          const loadMoreSettings = getLoadMoreSettings(resolverName, results);
          void fetchMore({
            variables: {
              settings: { ...recombeeSettings, loadMore: loadMoreSettings },
            },
            // Update the apollo cache with the combined results of previous loads and the items returned by the current loadMore
            updateQuery: (prev: AnyBecauseHard, { fetchMoreResult }: AnyBecauseHard) => {
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

const RecombeePostsListComponent = registerComponent('RecombeePostsList', RecombeePostsList, {styles});

declare global {
  interface ComponentTypes {
    RecombeePostsList: typeof RecombeePostsListComponent
  }
}
