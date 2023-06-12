import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { EagerPostComments } from './PostsPage/PostsPage';
import isEqual from 'lodash/isEqual';

const PostsCommentsThread = ({ post, eagerPostComments, terms, newForm=true }: {
  post?: PostsDetails,
  eagerPostComments?: EagerPostComments,
  terms: CommentsViewTerms,
  newForm?: boolean,
}) => {
  // check for deep equality between terms and eagerPostComments.terms
  const useEagerResults = eagerPostComments && isEqual(terms, eagerPostComments?.terms);

  const lazyResults = useMulti({
    terms,
    collectionName: "Comments",
    fragmentName: 'CommentsList',
    fetchPolicy: 'cache-and-network',
    enableTotal: true,
    skip: useEagerResults,
  });

  const { loading, results, loadMore, loadingMore, totalCount } = useEagerResults ? eagerPostComments.queryResponse : lazyResults;
  
  if (loading && !results) {
    return <Components.Loading />;
  } else if (!results) {
    return null;
  }

  const commentCount = results?.length ?? 0;

  return (
    <Components.CommentsListSection
      comments={results}
      loadMoreComments={loadMore}
      totalComments={totalCount as number}
      commentCount={commentCount}
      loadingMoreComments={loadingMore}
      post={post}
      newForm={newForm}
    />
  );
}

const PostsCommentsThreadComponent = registerComponent('PostsCommentsThread', PostsCommentsThread, {
  areEqual: {
    terms: "deep",
  }
});

declare global {
  interface ComponentTypes {
    PostsCommentsThread: typeof PostsCommentsThreadComponent
  }
}
