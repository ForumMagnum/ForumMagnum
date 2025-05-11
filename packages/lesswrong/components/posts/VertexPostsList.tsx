import React, { useState } from 'react';
import { NetworkStatus, gql, useQuery } from '@apollo/client';
import { VertexConfiguration } from '../../lib/collections/users/recommendationSettings';
import { useOnMountTracking } from '../../lib/analyticsEvents';
import { isServer } from '../../lib/executionEnvironment';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { fragmentTextForQuery } from "../../lib/vulcan-lib/fragments";
import LoadMore from "../common/LoadMore";
import PostsItem from "./PostsItem";
import SectionFooter from "../common/SectionFooter";
import PostsLoading from "./PostsLoading";

// Would be nice not to duplicate in postResolvers.ts but unfortunately the post types are different
interface VertexRecommendedPost {
  post: PostsListWithVotes,
  attributionId?: string,
}

const styles = (theme: ThemeType) => ({
  root: {

  }
});

const DEFAULT_RESOLVER_NAME = 'GoogleVertexPosts';

type VertexResolver = typeof DEFAULT_RESOLVER_NAME;

const getVertexPostsQuery = (resolverName: VertexResolver) => gql`
  query get${resolverName}($limit: Int) {
    ${resolverName}(limit: $limit) {
      results {
        post {
          ...PostsListWithVotes
        }
        attributionId
      }
    }
  }
  ${fragmentTextForQuery('PostsListWithVotes')}
`;

const getLoadMoreSettings = (resolverName: VertexResolver, results: VertexRecommendedPost[]): VertexConfiguration['loadMore'] => {
  switch (resolverName) {
    case DEFAULT_RESOLVER_NAME:
      const prevAttributionId = results.find(result => result.attributionId)?.attributionId;
      if (!prevAttributionId) {
        return undefined;
      }
      return { prevAttributionId };  
  }
}

export const stickiedPostTerms: PostsViewTerms = {
  view: 'stickied',
  limit: 4, // seriously, shouldn't have more than 4 stickied posts
  forum: true
};

export const VertexPostsList = ({ limit = 100, classes }: {
  limit?: number,
  classes: ClassesType<typeof styles>,
}) => {
  const [displayCount, setDisplayCount] = useState(15);

  const resolverName = DEFAULT_RESOLVER_NAME;

  const query = getVertexPostsQuery(resolverName);
  const { data, loading, networkStatus } = useQuery(query, {
    ssr: false || !isServer,
    notifyOnNetworkStatusChange: true,
    pollInterval: 0,
    variables: {
      limit,
    },
  });

  const results: VertexRecommendedPost[] | undefined = data?.[resolverName]?.results;
  const postIds = results?.map(({post}) => post._id) ?? [];

  useOnMountTracking({
    eventType: "postList",
    eventProps: { postIds },
    captureOnMount: (eventProps) => eventProps.postIds.length > 0,
    skip: !postIds.length || loading,
  });

  if (loading && !results) {
    return <PostsLoading placeholderCount={limit} />;
  }

  if (!results) {
    return null;
  }

  return <div>
    <div className={classes.root}>
      {results.slice(0, displayCount).map(({ post, attributionId }) => <PostsItem 
        key={post._id} 
        post={post} 
        vertexAttributionId={attributionId} 
      />)}
    </div>
    <SectionFooter>
      <LoadMore
        loading={loading || networkStatus === NetworkStatus.fetchMore}
        loadMore={() => {
          // Purely for admin testing, see e.g. RecombeePostsList for a custom loadMore implementation if we figure one out for Vertex
          if (displayCount < 100) {
            setDisplayCount(Math.min(100, displayCount + 15));
          }
        }}
        sectionFooterStyles
      />
    </SectionFooter>
  </div>;
}

export default registerComponent('VertexPostsList', VertexPostsList, {styles});


