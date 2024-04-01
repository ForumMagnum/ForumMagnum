import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { usePaginatedResolver } from '../hooks/usePaginatedResolver';

const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const ResolverPostsList = ({resolverName, skip, limit=13, fallbackText, classes}: {
  resolverName: string,
  skip?: boolean,
  limit?: number,
  fallbackText?: string
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  const { Loading, PostsItem } = Components;

  const { results, loading } = usePaginatedResolver({
    resolverName, 
    fragmentName: "PostsListWithVotes",
    limit,
    skip
  });

  if (loading) {
      return <Loading/>
  }

  if (!results ) {
    return <div>{fallbackText}</div>;
  }

  return <div>
    {results.map((post) => <PostsItem key={post._id} post={post} />)}
  </div>

}

const ResolverPostsListComponent = registerComponent('ResolverPostsList', ResolverPostsList, {styles});

declare global {
  interface ComponentTypes {
    ResolverPostsList: typeof ResolverPostsListComponent
  }
}

