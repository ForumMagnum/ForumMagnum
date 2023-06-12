import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { EagerPostComments } from './PostsPage/PostsPage';

const PostsCommentsThread = ({ post, eagerPostComments, terms, newForm=true }: {
  post?: PostsDetails,
  eagerPostComments?: EagerPostComments,
  terms: CommentsViewTerms,
  newForm?: boolean,
}) => {
  // check for deep equality between terms and eagerPostComments.terms
  const useEagerResults = eagerPostComments && JSON.stringify(terms) === JSON.stringify(eagerPostComments?.terms);
  console.log("useEagerResults", useEagerResults);
  console.log("eagerPostComments", eagerPostComments);
  console.log("terms", terms);

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
