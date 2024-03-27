import React from 'react';
import { Components, fragmentTextForQuery, registerComponent } from '../../lib/vulcan-lib';
import { gql, useQuery } from '@apollo/client';
import { RecombeeConfiguration } from '../../lib/collections/users/recommendationSettings';

interface RecombeeRecommendedPost {
  post: PostsListWithVotes,
  recommId: string,
}

const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const RecombeePostsList = ({ algorithm, settings, classes }: {
  algorithm: string,
  settings: RecombeeConfiguration,
  classes: ClassesType<typeof styles>,
}) => {
  const { Loading, PostsItem } = Components;

  const query = gql`
    query getRecombeeLatestPosts($limit: Int, $settings: JSON) {
      RecombeeLatestPosts(limit: $limit, settings: $settings) {
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

  const { data, loading } = useQuery(query, {
    ssr: true,
    notifyOnNetworkStatusChange: true,
    pollInterval: 0,
    variables: {
      limit: 13,
      settings: { ...settings, scenario: algorithm }
    },
  });

  const results: RecombeeRecommendedPost[] | undefined = data?.RecombeeLatestPosts?.results;

  if (loading) {
    return <Loading />;
  }

  return <div className={classes.root}>
    {results?.map(({post, recommId}) => <PostsItem key={post._id} post={post} recombeeRecommId={recommId}/>)}
  </div>;
}

const RecombeePostsListComponent = registerComponent('RecombeePostsList', RecombeePostsList, {styles});

declare global {
  interface ComponentTypes {
    RecombeePostsList: typeof RecombeePostsListComponent
  }
}
