import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';

const PostsCommentsThread = ({ post, terms, newForm=true }: {
  post?: PostsDetails,
  terms: OldCommentsViewTerms,
  newForm?: boolean,
}) => {
  const { loading, results, loadMore, loadingMore, totalCount, refetch } = useMulti({
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

  if (post?.requireCommentApproval && results) {
    return (
      <>
        <Components.CommentsListSection
          comments={results}
          loadMoreComments={loadMore}
          totalComments={totalCount as number}
          commentCount={(results.length) || 0}
          loadingMoreComments={loadingMore}
          post={post}
          newForm={newForm}
          approvalSection='approved'
          refetchAfterApproval={refetch}
        />
        <Components.CommentsListSection
          comments={results}
          loadMoreComments={loadMore}
          totalComments={totalCount as number}
          commentCount={(results.length) || 0}
          loadingMoreComments={loadingMore}
          post={post}
          newForm={false}
          approvalSection='rejected'
          refetchAfterApproval={refetch}
        />
      </>
    );
  }

  return (
    <Components.CommentsListSection
      comments={results}
      loadMoreComments={loadMore}
      totalComments={totalCount as number}
      commentCount={(results && results.length) || 0}
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
