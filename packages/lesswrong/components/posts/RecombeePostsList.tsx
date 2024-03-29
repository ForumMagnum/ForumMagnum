import React from 'react';
import { Components, fragmentTextForQuery, registerComponent } from '../../lib/vulcan-lib';
import { NetworkStatus, gql, useQuery } from '@apollo/client';
import { RecombeeConfiguration } from '../../lib/collections/users/recommendationSettings';
import { useMulti } from '../../lib/crud/withMulti';

interface RecombeeRecommendedPost {
  post: PostsListWithVotes,
  recommId: string,
}

const styles = (theme: ThemeType) => ({
  root: {

  }
});

const RESOLVER_NAME = 'RecombeeLatestPosts';

const getRecombeeLatestPostsQuery = gql`
  query get${RESOLVER_NAME}($limit: Int, $settings: JSON) {
    ${RESOLVER_NAME}(limit: $limit, settings: $settings) {
      results {
        post {
          ...PostsListWithVotes
        }
        recommId
      }
    }
  }
  ${fragmentTextForQuery('PostsListWithVotes')}
`;

const stickiedPostTerms: PostsViewTerms = {
  view: 'stickied',
  limit: 4, // seriously, shouldn't have more than 4 stickied posts
  forum: true
};

export const RecombeePostsList = ({ algorithm, settings, showSticky = false, limit = 12, classes }: {
  algorithm: string,
  settings: RecombeeConfiguration,
  showSticky?: boolean,
  limit?: number,
  classes: ClassesType<typeof styles>,
}) => {
  const { Loading, LoadMore, PostsItem, SectionFooter, CuratedPostsList } = Components;

  const { results: stickiedPosts } = useMulti({
    collectionName: "Posts",
    fragmentName: 'PostsListWithVotes',
    terms: stickiedPostTerms,
    skip: !showSticky,
  });

  const recombeeSettings = { ...settings, scenario: algorithm };

  const { data, loading, fetchMore, networkStatus } = useQuery(getRecombeeLatestPostsQuery, {
    ssr: true,
    notifyOnNetworkStatusChange: true,
    pollInterval: 0,
    variables: {
      limit,
      settings: recombeeSettings,
    },
  });

  const results: RecombeeRecommendedPost[] | undefined = data?.[RESOLVER_NAME]?.results;

  if (loading && !results) {
    return <Loading />;
  }

  if (!results) {
    return null;
  }

  const recommId = results.slice(-1)[0]?.recommId;

  return <div>
    <div className={classes.root}>
      <CuratedPostsList />
      {stickiedPosts?.map(post => <PostsItem key={post._id} post={post} terms={stickiedPostTerms}/>)}
      {results.map(({post, recommId}) => <PostsItem key={post._id} post={post} recombeeRecommId={recommId}/>)}
    </div>
    <SectionFooter>
      <LoadMore
        loading={loading || networkStatus === NetworkStatus.fetchMore}
        loadMore={() => {
          void fetchMore({
            variables: {
              settings: { ...recombeeSettings, loadMore: { prevRecommId: recommId } },
            },
            // Update the apollo cache with the combined results of previous loads and the items returned by the current loadMore
            updateQuery: (prev: AnyBecauseHard, { fetchMoreResult }: AnyBecauseHard) => {
              if (!fetchMoreResult) return prev;

              return {
                RecombeeLatestPosts: {
                  __typename: fetchMoreResult[RESOLVER_NAME].__typename,
                  results: [...prev[RESOLVER_NAME].results, ...fetchMoreResult[RESOLVER_NAME].results]
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
