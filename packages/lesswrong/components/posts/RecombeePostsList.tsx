import React from 'react';
import { Components, fragmentTextForQuery, registerComponent } from '../../lib/vulcan-lib';
import { gql, useQuery } from '@apollo/client';
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

export const RecombeePostsList = ({ algorithm, settings, showSticky=false, limit=12, classes }: {
  algorithm: string,
  settings: RecombeeConfiguration,
  showSticky?: boolean,
  limit?: number,
  classes: ClassesType<typeof styles>,
}) => {
  const { Loading, PostsItem, CuratedPostsList } = Components;

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

  const stickiedPostTerms: PostsViewTerms = {
      view: 'stickied',
      limit: 4, //seriously, shouldn't have more than 4 stickied posts
      forum: true
    }

  const { results: stickiedPosts, loading: stickiedLoading } = useMulti({
    collectionName: "Posts",
    fragmentName: 'PostsListWithVotes',
    terms: stickiedPostTerms,
    skip: !showSticky,
  })

  const { data, loading } = useQuery(query, {
    ssr: true,
    notifyOnNetworkStatusChange: true,
    pollInterval: 0,
    variables: {
      limit: limit,
      settings: { ...settings, scenario: algorithm }
    },
  });

  const results: RecombeeRecommendedPost[] | undefined = data?.RecombeeLatestPosts?.results;

  if (loading) {
    return <Loading />;
  }

  return <div className={classes.root}>
    <CuratedPostsList/>
    {stickiedPosts?.map(post => <PostsItem key={post._id} post={post} terms={stickiedPostTerms}/>)}
    {results?.map(({post, recommId}) => <PostsItem key={post._id} post={post} recombeeRecommId={recommId}/>)}
  </div>;
}

const RecombeePostsListComponent = registerComponent('RecombeePostsList', RecombeePostsList, {styles});

declare global {
  interface ComponentTypes {
    RecombeePostsList: typeof RecombeePostsListComponent
  }
}
