import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';

const PostsCommentsThread = ({ post, terms, newForm=true, excludeCommentIds }: {
  post?: PostsDetails,
  terms: CommentsViewTerms,
  newForm?: boolean,
  excludeCommentIds?: Set<string>
}) => {
  let { loading, results, loadMore, loadingMore, totalCount } = useMulti({
    terms,
    collectionName: "Comments",
    fragmentName: 'CommentsList',
    fetchPolicy: 'cache-and-network',
    enableTotal: true,
  });
  
  if (loading && !results) {
    return <Components.Loading />;
  } else if (!results) {
    return null;
  }

  if (excludeCommentIds) {
    results = results?.filter(comment => !excludeCommentIds.has(comment._id));
    // &&= is the LOGICAL AND assignment
    // it only performs the assignment if the current value is truthy - which is to say, neither undefined nor 0
    // normally we'd want to avoid treating 0 like that, but in this case we know we can't have a negative number of comments
    // so it's good to avoid that assignment
    totalCount &&= (totalCount - excludeCommentIds.size);
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
