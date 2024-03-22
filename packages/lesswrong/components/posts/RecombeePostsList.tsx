import React from 'react';
import { Components, fragmentTextForQuery, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { usePaginatedResolver } from '../hooks/usePaginatedResolver';
import { gql, useQuery } from '@apollo/client';

const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const RecombeePostsList = ({ algorithm, classes }: {
  algorithm: string,
  classes: ClassesType<typeof styles>,
}) => {
  const { Loading, PostsItem } = Components;

  const query = gql`
    query getRecombeeLatestPosts($limit: Int, $settings: JSON) {
      RecombeeLatestPosts(limit: $limit, settings: $settings) {
        results {
          ...PostsListWithVotes
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
      settings: { adminOverrides: { scenario: algorithm } }
    },
  });

  const results: PostsListWithVotes[] | undefined = data?.RecombeeLatestPosts?.results;

  if (loading) {
    return <Loading />;
  }

  return <div className={classes.root}>
    {results?.map(post => <PostsItem key={post._id} post={post} />)}
  </div>;
}

const RecombeePostsListComponent = registerComponent('RecombeePostsList', RecombeePostsList, {styles});

declare global {
  interface ComponentTypes {
    RecombeePostsList: typeof RecombeePostsListComponent
  }
}
