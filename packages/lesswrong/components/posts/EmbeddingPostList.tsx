import React, { useState } from 'react';
import { Components, fragmentTextForQuery, registerComponent } from '../../lib/vulcan-lib';
import { NetworkStatus, gql, useQuery } from '@apollo/client';
import { useOnMountTracking } from '../../lib/analyticsEvents';
import { useCurrentUser } from '../common/withUser';
import { aboutPostIdSetting } from '@/lib/instanceSettings';
import { IsRecommendationContext } from '../dropdowns/posts/PostActions';
import { RecommendedPost } from './RecombeePostsList';
import { RecombeeConfiguration } from '@/lib/collections/users/recommendationSettings';

const styles = (theme: ThemeType) => ({
  root: {

  }
});

const getEmbeddingPostsQuery = () => gql`
  query getEmbeddingPosts($limit: Int, $settings: JSON) {
    EmbeddingHybridPosts(limit: $limit, settings: $settings) {
      results {
        post {
          ...PostsListWithVotes
        }
        scenario
        curated
        stickied
      }
    }
  }
  ${fragmentTextForQuery('PostsListWithVotes')}
`;

export const stickiedPostTerms: PostsViewTerms = {
  view: 'stickied',
  limit: 4,
  forum: true
};

export const EmbeddingPostList = ({ algorithm, settings, limit = 15, classes }: {
  algorithm: string,
  settings: RecombeeConfiguration,
  limit?: number,
  classes: ClassesType<typeof styles>,
}) => {
  const { LoadMore, PostsItem, SectionFooter, PostsLoading } = Components;

  const [loadMoreCount, setLoadMoreCount] = useState(1);
  const currentUser = useCurrentUser();

  const embeddingSettings = { ...settings, scenario: algorithm };

  const query = getEmbeddingPostsQuery();
  const { data, loading, fetchMore, networkStatus } = useQuery(query, {
    notifyOnNetworkStatusChange: true,
    pollInterval: 0,
    variables: {
      limit,
      settings: embeddingSettings,
    },
  });

  const results: RecommendedPost[] | undefined = data?.EmbeddingHybridPosts?.results;

  const hiddenPostIds = currentUser?.hiddenPostsMetadata?.map(metadata => metadata.postId) ?? [];
  
  const filteredResults = results?.filter(({ post }) => !hiddenPostIds.includes(post._id));

  const postIds = filteredResults?.map(({post}) => post._id) ?? [];
  const postIdsWithScenario = filteredResults?.map(({ post, scenario, curated, stickied }, idx) => {
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

    return { postId: post._id, scenario: loggedScenario };
  }) ?? [];

  useOnMountTracking({
    eventType: "postList",
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
      {/* TODO: replace scenario from here*/}
      {filteredResults.map(({ post, curated, stickied, scenario }) => <IsRecommendationContext.Provider key={post._id} value={!!scenario}>
        <PostsItem 
          post={post} 
          // TODO: replace with proper identifier
          // recombeeRecommId={recommId}
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
          void fetchMore({
            variables: {
              settings: embeddingSettings,
            },
            updateQuery: (prev: AnyBecauseHard, { fetchMoreResult }: AnyBecauseHard) => {
              setLoadMoreCount(loadMoreCount + 1);

              if (!fetchMoreResult) return prev;

              return {
                EmbeddingPosts: {
                  __typename: fetchMoreResult.EmbeddingPosts.__typename,
                  results: [...prev.EmbeddingPosts.results, ...fetchMoreResult.EmbeddingPosts.results]
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

const EmbeddingPostListComponent = registerComponent('EmbeddingPostList', EmbeddingPostList, {styles});

declare global {
  interface ComponentTypes {
    EmbeddingPostList: typeof EmbeddingPostListComponent
  }
}
